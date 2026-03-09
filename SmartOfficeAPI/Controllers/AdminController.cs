using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartOfficeAPI.Data;
using SmartOfficeAPI.Services;

namespace SmartOfficeAPI.Controllers;

/// <summary>
/// Admin-only endpoints: stats dashboard, all bookings, all users, force-cancel.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IBookingService _bookingService;

    public AdminController(AppDbContext context, IBookingService bookingService)
    {
        _context = context;
        _bookingService = bookingService;
    }

    // GET /api/admin/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var today    = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        // Bookings today
        var bookingsToday = await _context.Bookings
            .CountAsync(b => b.Status == "Active" &&
                             b.StartTime >= today &&
                             b.StartTime < tomorrow);

        // All active bookings
        var totalActive = await _context.Bookings
            .CountAsync(b => b.Status == "Active");

        // Total resources & users
        var totalResources = await _context.Resources.CountAsync(r => r.IsActive);
        var totalEmployees = await _context.Users.CountAsync(u => u.Role == "Employee");

        // Available desks today (not booked during any part of today)
        var bookedResourceIdsToday = await _context.Bookings
            .Where(b => b.Status == "Active" &&
                        b.StartTime < tomorrow &&
                        b.EndTime > today)
            .Select(b => b.ResourceId)
            .Distinct()
            .ToListAsync();

        var availableDesks = await _context.Resources
            .CountAsync(r => r.Type == "Desk" &&
                             r.IsActive &&
                             !bookedResourceIdsToday.Contains(r.Id));

        // Most booked resource (all time)
        var topGroup = await _context.Bookings
            .Where(b => b.Status == "Active")
            .GroupBy(b => b.ResourceId)
            .Select(g => new { ResourceId = g.Key, Count = g.Count() })
            .OrderByDescending(g => g.Count)
            .FirstOrDefaultAsync();

        string? mostBookedResource = null;
        int mostBookedCount = 0;
        if (topGroup != null)
        {
            var res = await _context.Resources.FindAsync(topGroup.ResourceId);
            mostBookedResource = res?.Name;
            mostBookedCount    = topGroup.Count;
        }

        // Booking status breakdown
        var cancelled = await _context.Bookings.CountAsync(b => b.Status == "Cancelled");

        return Ok(new
        {
            bookingsToday,
            totalActiveBookings  = totalActive,
            totalCancelledBookings = cancelled,
            totalResources,
            totalEmployees,
            availableDesksToday  = availableDesks,
            mostBookedResource,
            mostBookedCount
        });
    }

    // GET /api/admin/bookings?from=&to=&status=&userId=&resourceId=
    [HttpGet("bookings")]
    public async Task<IActionResult> GetAllBookings(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string? status,
        [FromQuery] int? userId,
        [FromQuery] int? resourceId)
    {
        var bookings = await _bookingService.GetAllBookingsAsync(from, to, status, userId, resourceId);
        return Ok(bookings);
    }

    // GET /api/admin/users
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _context.Users
            .OrderBy(u => u.Name)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.Role,
                u.CreatedAt,
                TotalBookings  = u.Bookings.Count,
                ActiveBookings = u.Bookings.Count(b => b.Status == "Active")
            })
            .ToListAsync();

        return Ok(users);
    }

    // DELETE /api/admin/bookings/{id}/cancel  — Admin force-cancel any booking
    [HttpDelete("bookings/{id}/cancel")]
    public async Task<IActionResult> AdminCancelBooking(int id)
    {
        var (success, message) = await _bookingService.CancelBookingAsync(id, 0, "Admin");

        if (!success) return BadRequest(new { message });

        return Ok(new { message });
    }

    // GET /api/admin/resources  — all resources including inactive
    [HttpGet("resources")]
    public async Task<IActionResult> GetAllResources()
    {
        var resources = await _context.Resources
            .OrderBy(r => r.Type)
            .ThenBy(r => r.Name)
            .Select(r => new
            {
                r.Id, r.Name, r.Type, r.Capacity, r.Location, r.IsActive,
                TotalBookings  = r.Bookings.Count,
                ActiveBookings = r.Bookings.Count(b => b.Status == "Active")
            })
            .ToListAsync();

        return Ok(resources);
    }
}
