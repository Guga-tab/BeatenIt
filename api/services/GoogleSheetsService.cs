using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using Google.Apis.Sheets.v4;
using Google.Apis.Sheets.v4.Data;
using System.Globalization;
using Games.Models;

namespace Games.Services;
public class GoogleSheetsService
{
    private readonly SheetsService _sheetsService;
    private readonly string _spreadsheetId;

    public GoogleSheetsService(IConfiguration configuration)
{
    // Lê o ID da planilha do configuration (suporta GoogleSheets:SpreadsheetId)
    _spreadsheetId = configuration["GoogleSheets:SpreadsheetId"] 
        ?? Environment.GetEnvironmentVariable("GOOGLE_SPREADSHEET_ID") 
        ?? "YOUR_SHEET_ID";

    GoogleCredential credential;
    
    // Lê o JSON da credencial buscando pela configuração ou variável de ambiente correspondente
    var jsonContent = configuration["GoogleSheets:CredentialsJson"] 
        ?? Environment.GetEnvironmentVariable("GOOGLE_CREDENTIALS_JSON");

    if (!string.IsNullOrEmpty(jsonContent))
    {
        credential = GoogleCredential.FromJson(jsonContent)
            .CreateScoped(SheetsService.Scope.Spreadsheets);
    }
    else if (File.Exists("credentials.json"))
    {
        using var stream = new FileStream("credentials.json", FileMode.Open, FileAccess.Read);
        credential = GoogleCredential.FromStream(stream)
            .CreateScoped(SheetsService.Scope.Spreadsheets);
    }
    else
    {
        throw new FileNotFoundException("Credenciais do Google não encontradas.");
    }

    _sheetsService = new SheetsService(new BaseClientService.Initializer()
    {
        HttpClientInitializer = credential,
        ApplicationName = "BeatenIt",
    });
}

    public async Task<List<Game>> GetGamesAsync()
    {
        string range = "Played!A2:K1000"; 

        SpreadsheetsResource.ValuesResource.GetRequest request =
            _sheetsService.Spreadsheets.Values.Get(_spreadsheetId, range);

        ValueRange response = await request.ExecuteAsync();
        IList<IList<object>> values = response.Values;

        var games = new List<Game>();

        if (values != null && values.Count > 0)
        {
            for (int i = 0; i < values.Count; i++)
            {
                var row = values[i];
                
                if (row.Count == 0 || string.IsNullOrEmpty(row[0]?.ToString()))
                    continue;

                string GetCell(int index) => row.Count > index ? row[index]?.ToString()?.Trim() ?? "" : "";

                decimal? ratingVal = null;
                string ratingStr = GetCell(7).Replace(",", ".");
                if (decimal.TryParse(ratingStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var rate))
                {
                    ratingVal = rate;
                }

                TimeSpan? totalPlayedVal = null;
                string timeStr = GetCell(8);
                if (!string.IsNullOrEmpty(timeStr))
                {
                    if (timeStr.Contains('.')) timeStr = timeStr.Split('.')[0];
                    if (TimeSpan.TryParse(timeStr, out var time)) totalPlayedVal = time;
                }

                DateOnly? startedOnVal = ParseGoogleDate(GetCell(5));
                DateOnly? finishedOnVal = ParseGoogleDate(GetCell(6));

                int realRowNumber = i + 2; 
                int gameId = realRowNumber - 1;

                var game = new Game
                {
                    Id = gameId, 
                    Title = GetCell(0),
                    ReleaseYear = int.TryParse(GetCell(1), out var year) ? year : null,
                    Platform = GetCell(2),
                    PlayedOn = GetCell(3),
                    Ownership = Enum.TryParse<GameOwnership>(GetCell(4), true, out var ownership) ? ownership : GameOwnership.Owned,
                    StartedOn = startedOnVal,
                    FinishedOn = finishedOnVal,
                    Rating = ratingVal,
                    TotalPlayed = totalPlayedVal,
                    Mastered = GetCell(9).ToUpper() == "Y" || GetCell(9).ToUpper() == "TRUE",
                    Status = Enum.TryParse<GameStatus>(GetCell(10), true, out var status) ? status : GameStatus.Shelved
                };

                games.Add(game);
            }
        }

        return games;
    }

    private DateOnly? ParseGoogleDate(string dateStr)
    {
        if (string.IsNullOrEmpty(dateStr) || dateStr == "-")
            return null;

        if (double.TryParse(dateStr, NumberStyles.Any, CultureInfo.InvariantCulture, out double serialDate))
        {
            try
            {
                var dateTime = DateTime.FromOADate(serialDate);
                return DateOnly.FromDateTime(dateTime);
            }
            catch { }
        }

        string[] formats = { "dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy", "yyyy-MM-dd", "yyyy/MM/dd", "MM/dd/yyyy", "M/d/yyyy" };
        
        if (DateOnly.TryParseExact(dateStr, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
        {
            return parsedDate;
        }

        if (DateOnly.TryParse(dateStr, out var genericDate))
        {
            return genericDate;
        }

        return null;
    }

    public async Task AddGameAsync(Game newGame)
    {
        string range = "Played!A:K";

        var oblist = new List<object>()
        {
            newGame.Title,
            newGame.ReleaseYear.HasValue ? newGame.ReleaseYear.Value : "",
            newGame.Platform,
            newGame.PlayedOn,
            newGame.Ownership.ToString(),
            newGame.StartedOn.HasValue ? newGame.StartedOn.Value.ToString("dd/MM/yyyy") : "",
            newGame.FinishedOn.HasValue ? newGame.FinishedOn.Value.ToString("dd/MM/yyyy") : "",
            newGame.Rating.HasValue ? newGame.Rating.Value.ToString(CultureInfo.InvariantCulture) : "",
            newGame.TotalPlayed.HasValue ? newGame.TotalPlayed.Value.ToString(@"hh\:mm\:ss") : "",
            newGame.Mastered ? "Y" : "N",
            newGame.Status.ToString()
        };

        var valueRange = new ValueRange();
        valueRange.Values = new List<IList<object>> { oblist };

        SpreadsheetsResource.ValuesResource.AppendRequest request = 
            _sheetsService.Spreadsheets.Values.Append(valueRange, _spreadsheetId, range);
        
        request.ValueInputOption = SpreadsheetsResource.ValuesResource.AppendRequest.ValueInputOptionEnum.USERENTERED;
        await request.ExecuteAsync();
    }

    public async Task<bool> UpdateGameAsync(int id, Game updatedGame)
    {
        int rowNumber = id + 1; 
        string range = $"Played!A{rowNumber}:K{rowNumber}";

        var oblist = new List<object>()
        {
            updatedGame.Title,
            updatedGame.ReleaseYear.HasValue ? updatedGame.ReleaseYear.Value : "",
            updatedGame.Platform,
            updatedGame.PlayedOn,
            updatedGame.Ownership.ToString(),
            updatedGame.StartedOn.HasValue ? updatedGame.StartedOn.Value.ToString("dd/MM/yyyy") : "",
            updatedGame.FinishedOn.HasValue ? updatedGame.FinishedOn.Value.ToString("dd/MM/yyyy") : "",
            updatedGame.Rating.HasValue ? updatedGame.Rating.Value.ToString(CultureInfo.InvariantCulture) : "",
            updatedGame.TotalPlayed.HasValue ? updatedGame.TotalPlayed.Value.ToString(@"hh\:mm\:ss") : "",
            updatedGame.Mastered ? "Y" : "N",
            updatedGame.Status.ToString()
        };

        var valueRange = new ValueRange();
        valueRange.Values = new List<IList<object>> { oblist };

        SpreadsheetsResource.ValuesResource.UpdateRequest request = 
            _sheetsService.Spreadsheets.Values.Update(valueRange, _spreadsheetId, range);
        
        request.ValueInputOption = SpreadsheetsResource.ValuesResource.UpdateRequest.ValueInputOptionEnum.USERENTERED;
        await request.ExecuteAsync();
        return true;
    }

    public async Task<bool> DeleteGameAsync(int id)
    {
        int rowNumber = id + 1;
        string range = $"Played!A{rowNumber}:K{rowNumber}";

        var clearRequest = new ClearValuesRequest();
        SpreadsheetsResource.ValuesResource.ClearRequest request = 
            _sheetsService.Spreadsheets.Values.Clear(clearRequest, _spreadsheetId, range);
        
        await request.ExecuteAsync();
        return true;
    }
}