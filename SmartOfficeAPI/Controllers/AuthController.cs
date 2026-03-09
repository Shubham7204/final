using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartOfficeAPI.DTOs;
using SmartOfficeAPI.Services;

namespace SmartOfficeAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // POST /api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Name, email and password are required." });

        var (success, message, data) = await _authService.RegisterAsync(request);

        if (!success)
            return Conflict(new { message });

        return CreatedAtAction(nameof(GetProfile), data);
    }

    // POST /api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);

        if (result == null)
            return Unauthorized(new { message = "Invalid email or password." });

        return Ok(result);
    }

    // GET /api/auth/me  (requires JWT)
    [HttpGet("me")]
    [Authorize]
    public IActionResult GetProfile()
    {
        return Ok(new
        {
            id    = User.FindFirstValue(ClaimTypes.NameIdentifier),
            name  = User.FindFirstValue(ClaimTypes.Name),
            email = User.FindFirstValue(ClaimTypes.Email),
            role  = User.FindFirstValue(ClaimTypes.Role)
        });
    }
}
