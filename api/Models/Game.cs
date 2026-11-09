using System.Text.Json.Serialization;

namespace Games.Models;

public enum GameStatus
{
    Played,
    Playing,
    Completed,
    Retired,
    Shelved,
    Abandoned
}

public enum GameOwnership
{
    Owned,
    Borrowed,
    Subscription
}

public class Game
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int? ReleaseYear { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string PlayedOn { get; set; } = string.Empty;
    
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public GameOwnership Ownership { get; set; }
    
    public DateOnly? StartedOn { get; set; }
    public DateOnly? FinishedOn { get; set; }
    
    public decimal? Rating { get; set; }
    
    public TimeSpan? TotalPlayed { get; set; }
    
    public bool Mastered { get; set; }
    
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public GameStatus Status { get; set; }
}