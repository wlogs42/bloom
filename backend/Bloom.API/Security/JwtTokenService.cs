using System.Security.Claims;
using System.Security.Cryptography;
using Bloom.Domain.Models;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Bloom.API.Security;

public sealed class JwtTokenService(SymmetricSecurityKey key)
{
    public const string Issuer = "Bloom.API";
    public const string Audience = "Bloom.App";

    public string Create(User user, string sessionId) => new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
    {
        Issuer = Issuer,
        Audience = Audience,
        Subject = new ClaimsIdentity([
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, sessionId),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Name, user.Name),
        ]),
        Expires = DateTime.UtcNow.AddDays(30),
        SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256),
    });

    public static SymmetricSecurityKey LoadKey(string? configured, string keyFile)
    {
        if (!string.IsNullOrWhiteSpace(configured)) return new SymmetricSecurityKey(Convert.FromBase64String(configured));
        if (!File.Exists(keyFile))
        {
            Directory.CreateDirectory(Path.GetDirectoryName(keyFile)!);
            File.WriteAllText(keyFile, Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)));
        }
        return new SymmetricSecurityKey(Convert.FromBase64String(File.ReadAllText(keyFile).Trim()));
    }
}
