using Microsoft.EntityFrameworkCore;
using SmartOfficeAPI.Data;
using SmartOfficeAPI.DTOs;
using SmartOfficeAPI.Models;

namespace SmartOfficeAPI.Services;

public class BookingService : IBookingService
{
    private readonly AppDbContext _context;

    public BookingService(AppDbContext context)
    {
        _context = context;
    }

    // ── Create Booking ────────────────────────────────────────────────────────

    public async Task<(bool Success, string Message, BookingResponse? Data)> CreateBookingAsync(
        int userId, CreateBookingRequest request)
    {
        // Basic time validation
        if (request.StartTime >= request.EndTime)
            return (false, "Start time must be before end time.", null);

        if (request.StartTime < DateTime.UtcNow)
            return (false, "Cannot book a time slot in the past.", null);

        // Resource must exist and be active
        var resource = await _context.Resources
            .FirstOrDefaultAsync(r => r.Id == request.ResourceId && r.IsActive);

        if (resource == null)
            return (false, "Resource not found or is currently inactive.", null);

        // ── Conflict Detection (the core booking logic) ───────────────────────
        // A conflict exists when:
        //   Existing.StartTime < Requested.EndTime  AND  Existing.EndTime > Requested.StartTime
        var hasConflict = await _context.Bookings.AnyAsync(b =>
            b.ResourceId == request.ResourceId &&
            b.Status == "Active" &&
            b.StartTime < request.EndTime &&
            b.EndTime > request.StartTime
        );

        if (hasConflict)
            return (false, "This resource is already booked for the selected time slot. Please choose a different time.", null);

        var booking = new Booking
        {
            UserId = userId,
            ResourceId = request.ResourceId,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Notes = request.Notes,
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync();

        // Reload with navigation properties
        var created = await GetBookingByIdAsync(booking.Id);
        return (true, "Booking confirmed successfully.", created);
    }

    // ── Cancel Booking ────────────────────────────────────────────────────────

    public async Task<(bool Success, string Message)> CancelBookingAsync(
        int bookingId, int requestingUserId, string requestingUserRole)
    {
        var booking = await _context.Bookings.FindAsync(bookingId);

        if (booking == null)
            return (false, "Booking not found.");

        // Only owner or Admin can cancel
        if (requestingUserRole != "Admin" && booking.UserId != requestingUserId)
            return (false, "You are not authorised to cancel this booking.");

        if (booking.Status == "Cancelled")
            return (false, "This booking is already cancelled.");

        booking.Status = "Cancelled";
        await _context.SaveChangesAsync();

        return (true, "Booking cancelled successfully.");
    }

    // ── Update Booking ────────────────────────────────────────────────────────

    public async Task<(bool Success, string Message, BookingResponse? Data)> UpdateBookingAsync(
        int bookingId, int userId, UpdateBookingRequest request)
    {
        var booking = await _context.Bookings.FindAsync(bookingId);

        if (booking == null)
            return (false, "Booking not found.", null);

        if (booking.UserId != userId)
            return (false, "You are not authorised to modify this booking.", null);

        if (booking.Status == "Cancelled")
            return (false, "Cannot update a cancelled booking.", null);

        var newStart = request.StartTime ?? booking.StartTime;
        var newEnd = request.EndTime ?? booking.EndTime;

        if (newStart >= newEnd)
            return (false, "Start time must be before end time.", null);

        if (newStart < DateTime.UtcNow)
            return (false, "Cannot move a booking to a past time.", null);

        // Conflict check — exclude the current booking itself
        var hasConflict = await _context.Bookings.AnyAsync(b =>
            b.Id != bookingId &&
            b.ResourceId == booking.ResourceId &&
            b.Status == "Active" &&
            b.StartTime < newEnd &&
            b.EndTime > newStart
        );

        if (hasConflict)
            return (false, "Another booking already exists for the new time slot.", null);

        booking.StartTime = newStart;
        booking.EndTime = newEnd;
        if (request.Notes != null) booking.Notes = request.Notes;

        await _context.SaveChangesAsync();

        return (true, "Booking updated successfully.", await GetBookingByIdAsync(bookingId));
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    public async Task<List<BookingResponse>> GetUserBookingsAsync(int userId)
    {
        var bookings = await _context.Bookings
            .Where(b => b.UserId == userId)
            .Include(b => b.User)
            .Include(b => b.Resource)
            .OrderByDescending(b => b.StartTime)
            .ToListAsync();

        return bookings.Select(MapToResponse).ToList();
    }

    public async Task<List<BookingResponse>> GetAllBookingsAsync(
        DateTime? from, DateTime? to, string? status, int? userId, int? resourceId)
    {
        var query = _context.Bookings
            .Include(b => b.User)
            .Include(b => b.Resource)
            .AsQueryable();

        // LINQ filtering
        if (from.HasValue)       query = query.Where(b => b.StartTime >= from.Value);
        if (to.HasValue)         query = query.Where(b => b.StartTime <= to.Value);
        if (!string.IsNullOrEmpty(status))  query = query.Where(b => b.Status == status);
        if (userId.HasValue)     query = query.Where(b => b.UserId == userId.Value);
        if (resourceId.HasValue) query = query.Where(b => b.ResourceId == resourceId.Value);

        var bookings = await query
            .OrderByDescending(b => b.StartTime)
            .ToListAsync();

        return bookings.Select(MapToResponse).ToList();
    }

    public async Task<BookingResponse?> GetBookingByIdAsync(int bookingId)
    {
        var booking = await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.Resource)
            .FirstOrDefaultAsync(b => b.Id == bookingId);

        return booking is null ? null : MapToResponse(booking);
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    private static BookingResponse MapToResponse(Booking b) => new()
    {
        Id = b.Id,
        UserId = b.UserId,
        UserName = b.User.Name,
        UserEmail = b.User.Email,
        ResourceId = b.ResourceId,
        ResourceName = b.Resource.Name,
        ResourceType = b.Resource.Type,
        ResourceLocation = b.Resource.Location,
        StartTime = b.StartTime,
        EndTime = b.EndTime,
        Status = b.Status,
        Notes = b.Notes,
        CreatedAt = b.CreatedAt
    };
}
