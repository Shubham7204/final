using SmartOfficeAPI.DTOs;

namespace SmartOfficeAPI.Services;

public interface IBookingService
{
    Task<(bool Success, string Message, BookingResponse? Data)> CreateBookingAsync(int userId, CreateBookingRequest request);
    Task<(bool Success, string Message)> CancelBookingAsync(int bookingId, int requestingUserId, string requestingUserRole);
    Task<(bool Success, string Message, BookingResponse? Data)> UpdateBookingAsync(int bookingId, int userId, UpdateBookingRequest request);
    Task<List<BookingResponse>> GetUserBookingsAsync(int userId);
    Task<List<BookingResponse>> GetAllBookingsAsync(DateTime? from, DateTime? to, string? status, int? userId, int? resourceId);
    Task<BookingResponse?> GetBookingByIdAsync(int bookingId);
}
