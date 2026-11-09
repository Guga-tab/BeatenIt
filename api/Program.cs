using GameCatalogApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();

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


app.MapGet("/api/games", () => 
{
    return Results.Ok(games);
})
.WithName("GetAllGames");

app.MapGet("/api/games/{id}", (int id) => 
{
    var game = games.FirstOrDefault(g => g.Id == id);
    return game is not null ? Results.Ok(game) : Results.NotFound("Jogo não encontrado.");
})
.WithName("GetGameById");

app.MapPost("/api/games", (Game newGame) => 
{
    newGame.Id = games.Count > 0 ? games.Max(g => g.Id) + 1 : 1;
    games.Add(newGame);
    
    return Results.Created($"/api/games/{newGame.Id}", newGame);
})
.WithName("CreateGame");

app.MapPut("/api/games/{id}", (int id, Game updatedGame) => 
{
    var game = games.FirstOrDefault(g => g.Id == id);
    if (game is null) return Results.NotFound("Jogo não encontrado.");

    game.Title = updatedGame.Title;
    game.ReleaseYear = updatedGame.ReleaseYear;
    game.Platform = updatedGame.Platform;
    game.PlayedOn = updatedGame.PlayedOn;
    game.Ownership = updatedGame.Ownership;
    game.StartedOn = updatedGame.StartedOn;
    game.FinishedOn = updatedGame.FinishedOn;
    game.Rating = updatedGame.Rating;
    game.TotalPlayed = updatedGame.TotalPlayed;
    game.Mastered = updatedGame.Mastered;
    game.Status = updatedGame.Status;

    return Results.NoContent();
})
.WithName("UpdateGame");

app.MapDelete("/api/games/{id}", (int id) => 
{
    var game = games.FirstOrDefault(g => g.Id == id);
    if (game is null) return Results.NotFound("Jogo não encontrado.");

    games.Remove(game);
    return Results.NoContent();
})
.WithName("DeleteGame");

app.Run();