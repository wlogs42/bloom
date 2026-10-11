using Bloom.Application.Interfaces;
using Bloom.Application.Services;
using Bloom.API.Seed;
using Bloom.Infrastructure.Persistence;
using Bloom.API.Security;
using System.Security.Claims;
using Bloom.API.Contracts;
using Bloom.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var databasePath = Path.GetFullPath(builder.Configuration["Database:Path"] ?? Path.Combine(builder.Environment.ContentRootPath, "App_Data", "bloom.db"));
var dataDirectory = Path.GetDirectoryName(databasePath)!;
var uploadsDirectory = Path.GetFullPath(builder.Configuration["Uploads:Path"] ?? Path.Combine(dataDirectory, "uploads"));
var jwtKey = JwtTokenService.LoadKey(builder.Configuration["Jwt:Key"], Path.Combine(dataDirectory, "jwt.key"));

builder.Services.AddSingleton<IPersonalStore>(_ => new SqlitePersonalStore(databasePath));
builder.Services.AddSingleton<IPhotoStorage>(new FilePhotoStorage(uploadsDirectory));
builder.Services.AddSingleton(new JwtTokenService(jwtKey));
builder.Services.AddSingleton<IUserRepository>(services => services.GetRequiredService<IPersonalStore>());
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidIssuer = JwtTokenService.Issuer,
        ValidAudience = JwtTokenService.Audience,
        IssuerSigningKey = jwtKey,
        ValidateIssuerSigningKey = true,
        ClockSkew = TimeSpan.FromMinutes(1),
    };
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = context =>
        {
            var sessionId = context.Principal!.FindFirstValue(JwtRegisteredClaimNames.Jti);
            var user = sessionId is null ? null : context.HttpContext.RequestServices.GetRequiredService<IPersonalStore>().Authenticate(sessionId);
            if (user?.Id.ToString() != context.Principal!.FindFirstValue(JwtRegisteredClaimNames.Sub)) context.Fail("Session expired.");
            return Task.CompletedTask;
        },
    };
});
builder.Services.AddAuthorization();
builder.Services.AddSingleton<IPasswordService, PasswordService>();
builder.Services.AddScoped<LoginService>();
builder.Services.AddScoped<RegisterService>();
builder.Services.AddControllers().ConfigureApiBehaviorOptions(options =>
{
    options.InvalidModelStateResponseFactory = _ =>
        new BadRequestObjectResult(new { message = "Перевір заповнення полів: ім’я, пошту, пароль і фото." });
});
builder.Services.AddProblemDetails();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
        .AllowAnyHeader()
        .WithMethods("GET", "POST", "PUT", "DELETE")));

var app = builder.Build();
app.UseExceptionHandler();
app.UseCors();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsDirectory),
    RequestPath = UserResponse.PhotoPath,
    OnPrepareResponse = context => context.Context.Response.Headers.XContentTypeOptions = "nosniff",
});
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
    UserSeeder.Seed(app.Services.GetRequiredService<IPersonalStore>(), app.Services.GetRequiredService<IPasswordService>());

app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "Bloom.API" }));
app.MapControllers();
app.Run();
