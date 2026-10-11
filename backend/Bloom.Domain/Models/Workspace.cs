namespace Bloom.Domain.Models;

public sealed record BloomTask(Guid Id, string Title, string Category, int Minutes, bool Completed, DateTimeOffset CreatedAt, DateTimeOffset? CompletedAt);
public sealed record FocusSession(Guid Id, int Minutes, DateTimeOffset CompletedAt);
public sealed class FocusTimer
{
    public int DurationMinutes { get; set; } = 25;
    public long RemainingMs { get; set; } = 25 * 60_000;
    public long? Deadline { get; set; }
    public Guid RunId { get; set; } = Guid.NewGuid();
}
public sealed class Workspace
{
    public List<BloomTask> Tasks { get; set; } = [];
    public List<FocusSession> Sessions { get; set; } = [];
    public FocusTimer Timer { get; set; } = new();
    public long ServerNow { get; set; }
}
