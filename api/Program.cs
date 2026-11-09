using Games.Models;
using Games.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<GoogleSheetsService>();

var app = builder.Build();

app.UseHttpsRedirection();

var games = new List<Game>
{
    new Game 
    { 
        Id = 1, 
        Title = "Alice: Madness Returns", 
        ReleaseYear = 2011, 
        Platform = "Windows", 
        PlayedOn = "Steam", 
        Ownership = GameOwnership.Owned, 
        FinishedOn = new DateOnly(2025, 5, 24), 
        Rating = 3.0m,
        TotalPlayed = new TimeSpan(20, 2, 0), 
        Mastered = false, 
        Status = GameStatus.Completed 
    },
    new Game 
    { 
        Id = 2, 
        Title = "Batman: Arkham Asylum", 
        ReleaseYear = 2009, 
        Platform = "Windows", 
        PlayedOn = "Steam", 
        Ownership = GameOwnership.Owned, 
        FinishedOn = new DateOnly(2023, 1, 25), 
        Rating = 5.0m, 
        TotalPlayed = new TimeSpan(27, 50, 0), 
        Mastered = true, 
        Status = GameStatus.Completed 
    },
    new Game 
    { 
        Id = 3, 
        Title = "Dark Souls: Remastered", 
        ReleaseYear = 2018, 
        Platform = "Windows", 
        PlayedOn = "Windows", 
        Ownership = GameOwnership.Borrowed, 
        StartedOn = new DateOnly(2026, 10, 31),
        Rating = null,
        TotalPlayed = null, 
        Mastered = false, 
        Status = GameStatus.Playing 
    }
};


app.MapGet("/api/games", async (GoogleSheetsService sheetsService) => 
{
    var games = await sheetsService.GetGamesAsync();
    return Results.Ok(games);
})
.WithName("GetAllGames");

app.MapGet("/api/games/{id}", async (int id, GoogleSheetsService sheetsService) => 
{
    var games = await sheetsService.GetGamesAsync();
    var game = games.FirstOrDefault(g => g.Id == id);
    return game is not null ? Results.Ok(game) : Results.NotFound("Jogo não encontrado.");
})
.WithName("GetGameById");

app.MapPost("/api/games", async (Game newGame, GoogleSheetsService sheetsService) => 
{
    await sheetsService.AddGameAsync(newGame);
    return Results.Created($"/api/games", newGame);
})
.WithName("CreateGame");

app.MapPut("/api/games/{id}", async (int id, Game updatedGame, GoogleSheetsService sheetsService) => 
{
    await sheetsService.UpdateGameAsync(id, updatedGame);
    return Results.NoContent();
})
.WithName("UpdateGame");

app.MapDelete("/api/games/{id}", async (int id, GoogleSheetsService sheetsService) => 
{
    await sheetsService.DeleteGameAsync(id);
    return Results.NoContent();
})
.WithName("DeleteGame");

app.Run();