using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Bloom.Application.Interfaces;
using Bloom.Domain.Models;
using Microsoft.Data.Sqlite;

namespace Bloom.Infrastructure.Persistence;

public sealed class SqlitePersonalStore : IPersonalStore
{
    private readonly string _connectionString;
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public SqlitePersonalStore(string path)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
        _connectionString = new SqliteConnectionStringBuilder { DataSource = path, ForeignKeys = true }.ToString();
        using var db = Open();
        using var command = db.CreateCommand();
        command.CommandText = """
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS Users (Id TEXT PRIMARY KEY, Name TEXT NOT NULL, Email TEXT NOT NULL COLLATE NOCASE UNIQUE, PasswordHash TEXT NOT NULL, Photo TEXT);
            CREATE TABLE IF NOT EXISTS Sessions (TokenHash TEXT PRIMARY KEY, UserId TEXT NOT NULL REFERENCES Users(Id) ON DELETE CASCADE, ExpiresAt INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS Workspaces (UserId TEXT PRIMARY KEY REFERENCES Users(Id) ON DELETE CASCADE, Json TEXT NOT NULL);
            """;
        command.ExecuteNonQuery();
        using var hasPhoto = Command(db, "SELECT COUNT(*) FROM pragma_table_info('Users') WHERE name='Photo'");
        if ((long)hasPhoto.ExecuteScalar()! == 0)
        {
            using var alter = Command(db, "ALTER TABLE Users ADD COLUMN Photo TEXT");
            alter.ExecuteNonQuery();
        }
    }

    private SqliteConnection Open() { var db = new SqliteConnection(_connectionString); db.Open(); return db; }
    private static SqliteCommand Command(SqliteConnection db, string sql, params (string, object?)[] values)
    {
        var command = db.CreateCommand(); command.CommandText = sql;
        foreach (var (key, value) in values) command.Parameters.AddWithValue(key, value ?? DBNull.Value);
        return command;
    }
    private static User? ReadUser(SqliteCommand command)
    {
        using var row = command.ExecuteReader();
        return row.Read() ? new User(Guid.Parse(row.GetString(0)), row.GetString(1), row.GetString(2), row.GetString(3), row.IsDBNull(4) ? null : row.GetString(4)) : null;
    }
    public User? FindByEmail(string email)
    {
        using var db = Open(); using var command = Command(db, "SELECT Id,Name,Email,PasswordHash,Photo FROM Users WHERE Email=$email", ("$email", email.Trim())); return ReadUser(command);
    }
    public User? FindById(Guid id)
    {
        using var db = Open(); using var command = Command(db, "SELECT Id,Name,Email,PasswordHash,Photo FROM Users WHERE Id=$id", ("$id", id.ToString())); return ReadUser(command);
    }
    public bool TryAdd(User user)
    {
        using var db = Open(); using var command = Command(db, "INSERT INTO Users (Id,Name,Email,PasswordHash,Photo) VALUES ($id,$name,$email,$hash,$photo) ON CONFLICT(Email) DO NOTHING", ("$id", user.Id.ToString()), ("$name", user.Name), ("$email", user.Email), ("$hash", user.PasswordHash), ("$photo", user.Photo));
        return command.ExecuteNonQuery() == 1;
    }
    public bool UpdateUser(User user)
    {
        using var db = Open(); using var command = Command(db, "UPDATE Users SET Name=$name, Email=$email WHERE Id=$id", ("$id", user.Id.ToString()), ("$name", user.Name), ("$email", user.Email));
        try { return command.ExecuteNonQuery() == 1; } catch (SqliteException error) when (error.SqliteErrorCode == 19) { return false; }
    }
    private static string TokenHash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    public string CreateSession(Guid userId)
    {
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        using var db = Open(); using var command = Command(db, "DELETE FROM Sessions WHERE ExpiresAt<=$now; INSERT INTO Sessions VALUES ($token,$id,$expires)", ("$now", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()), ("$token", TokenHash(token)), ("$id", userId.ToString()), ("$expires", DateTimeOffset.UtcNow.AddDays(30).ToUnixTimeMilliseconds()));
        command.ExecuteNonQuery(); return token;
    }
    public User? Authenticate(string token)
    {
        if (token.Length != 64) return null;
        using var db = Open(); using var command = Command(db, "SELECT u.Id,u.Name,u.Email,u.PasswordHash,u.Photo FROM Users u JOIN Sessions s ON s.UserId=u.Id WHERE s.TokenHash=$token AND s.ExpiresAt>$now", ("$token", TokenHash(token)), ("$now", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds())); return ReadUser(command);
    }
    public void RevokeSession(string token)
    {
        using var db = Open(); using var command = Command(db, "DELETE FROM Sessions WHERE TokenHash=$token", ("$token", TokenHash(token))); command.ExecuteNonQuery();
    }
    public void ChangePassword(Guid userId, string hash, string currentToken)
    {
        using var db = Open(); using var transaction = db.BeginTransaction();
        using var command = Command(db, "UPDATE Users SET PasswordHash=$hash WHERE Id=$id; DELETE FROM Sessions WHERE UserId=$id AND TokenHash<>$token", ("$hash", hash), ("$id", userId.ToString()), ("$token", TokenHash(currentToken)));
        command.Transaction = transaction; command.ExecuteNonQuery(); transaction.Commit();
    }
    public Workspace ReadWorkspace(Guid userId) => UpdateWorkspace(userId, _ => { });
    public Workspace UpdateWorkspace(Guid userId, Action<Workspace> update)
    {
        using var db = Open(); using var transaction = db.BeginTransaction();
        using var read = Command(db, "SELECT Json FROM Workspaces WHERE UserId=$id", ("$id", userId.ToString())); read.Transaction = transaction;
        var raw = read.ExecuteScalar() as string;
        var workspace = raw is null ? new Workspace() : JsonSerializer.Deserialize<Workspace>(raw, Json)!;
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        if (workspace.Timer.Deadline is long deadline && deadline <= now)
        {
            workspace.Sessions.Add(new FocusSession(workspace.Timer.RunId, workspace.Timer.DurationMinutes, DateTimeOffset.FromUnixTimeMilliseconds(deadline)));
            workspace.Timer.Deadline = null; workspace.Timer.RemainingMs = 0;
        }
        workspace.ServerNow = now;
        update(workspace);
        using var write = Command(db, "INSERT INTO Workspaces VALUES ($id,$json) ON CONFLICT(UserId) DO UPDATE SET Json=excluded.Json", ("$id", userId.ToString()), ("$json", JsonSerializer.Serialize(workspace, Json))); write.Transaction = transaction;
        write.ExecuteNonQuery(); transaction.Commit(); return workspace;
    }
}
