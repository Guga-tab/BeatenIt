using Games.Models;
using Games.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<GoogleSheetsService>();

// 1. Configurar Política de CORS para liberar o React (Vite)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Porta padrão do React/Vite
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Remova ou comente app.UseHttpsRedirection() se estiver testando puramente via HTTP em localhost
// app.UseHttpsRedirection();

// 2. Ativar o middleware do CORS (TEM que vir antes dos MapGet/MapPost)
app.UseCors("AllowReactApp");

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