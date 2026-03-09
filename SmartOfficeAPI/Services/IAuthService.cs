using SmartOfficeAPI.DTOs;

namespace SmartOfficeAPI.Services;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<(bool Success, string Message, AuthResponse? Data)> RegisterAsync(RegisterRequest request);
}
