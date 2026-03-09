using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SmartOfficeAPI.Data;
using SmartOfficeAPI.Models;
using SmartOfficeAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Application Services ──────────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IBookingService, BookingService>();

// ── JWT Authentication ────────────────────────────────────────────────────────
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey   = jwtSettings["SecretKey"]!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = jwtSettings["Issuer"],
        ValidAudience            = jwtSettings["Audience"],
        IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

builder.Services.AddAuthorization();
builder.Services.AddControllers();

// ── CORS (React frontend) ─────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// ── Swagger with JWT support ──────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "Smart Office API",
        Version     = "v1",
        Description = "Resource booking system — meeting rooms, desks & equipment."
    });

    // Allows pasting Bearer token directly in Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name        = "Authorization",
        Type        = SecuritySchemeType.Http,
        Scheme      = "Bearer",
        BearerFormat = "JWT",
        In          = ParameterLocation.Header,
        Description = "Paste your JWT token here (without the 'Bearer ' prefix)."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ── Auto-migrate & Seed ───────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    // Seed admin account if none exists
    if (!db.Users.Any(u => u.Role == "Admin"))
    {
        db.Users.Add(new User
        {
            Name         = "Admin",
            Email        = "admin@smartoffice.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role         = "Admin",
            CreatedAt    = DateTime.UtcNow
        });
        db.SaveChanges();
    }

    // Seed sample resources if the table is empty
    if (!db.Resources.Any())
    {
        db.Resources.AddRange(
            new Resource { Name = "Board Room A",          Type = "MeetingRoom", Capacity = 20, Location = "Floor 1",               IsActive = true },
            new Resource { Name = "Meeting Room B",        Type = "MeetingRoom", Capacity = 10, Location = "Floor 2",               IsActive = true },
            new Resource { Name = "Meeting Room C",        Type = "MeetingRoom", Capacity = 6,  Location = "Floor 3",               IsActive = true },
            new Resource { Name = "Desk D01",              Type = "Desk",        Capacity = 1,  Location = "Floor 1 – Open Space",  IsActive = true },
            new Resource { Name = "Desk D02",              Type = "Desk",        Capacity = 1,  Location = "Floor 1 – Open Space",  IsActive = true },
            new Resource { Name = "Desk D03",              Type = "Desk",        Capacity = 1,  Location = "Floor 2 – Quiet Zone",  IsActive = true },
            new Resource { Name = "Projector P1",          Type = "Equipment",   Capacity = 1,  Location = "Floor 1 – Storage",     IsActive = true },
            new Resource { Name = "Projector P2",          Type = "Equipment",   Capacity = 1,  Location = "Floor 2 – Storage",     IsActive = true },
            new Resource { Name = "Video Conference Kit",  Type = "Equipment",   Capacity = 1,  Location = "Reception",             IsActive = true }
        );
        db.SaveChanges();
    }
}

// ── Middleware Pipeline ───────────────────────────────────────────────────────

// Swagger available in all environments for demo purposes
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Smart Office API v1");
    c.RoutePrefix = string.Empty; // Swagger opens at root: http://localhost:<port>/
});

app.UseCors("ReactPolicy");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
