using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartOfficeAPI.DTOs;
using SmartOfficeAPI.Services;

namespace SmartOfficeAPI.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private string GetUserRole() =>
        User.FindFirstValue(ClaimTypes.Role)!;

    // POST /api/bookings
    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
    {
        var (success, message, data) = await _bookingService.CreateBookingAsync(GetUserId(), request);

        if (!success) return BadRequest(new { message });

        return CreatedAtAction(nameof(GetBooking), new { id = data!.Id }, data);
    }

    // GET /api/bookings/my  — logged-in user's own bookings
    [HttpGet("my")]
    public async Task<IActionResult> GetMyBookings()
    {
        var bookings = await _bookingService.GetUserBookingsAsync(GetUserId());
        return Ok(bookings);
    }

    // GET /api/bookings/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetBooking(int id)
    {
        var booking = await _bookingService.GetBookingByIdAsync(id);
        if (booking == null) return NotFound(new { message = "Booking not found." });

        // Employees can only read their own bookings
        if (GetUserRole() != "Admin" && booking.UserId != GetUserId())
            return Forbid();

        return Ok(booking);
    }

    // PUT /api/bookings/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBooking(int id, [FromBody] UpdateBookingRequest request)
    {
        var (success, message, data) = await _bookingService.UpdateBookingAsync(id, GetUserId(), request);

        if (!success) return BadRequest(new { message });

        return Ok(data);
    }

    // DELETE /api/bookings/{id}/cancel
    [HttpDelete("{id}/cancel")]
    public async Task<IActionResult> CancelBooking(int id)
    {
        var (success, message) = await _bookingService.CancelBookingAsync(id, GetUserId(), GetUserRole());

        if (!success) return BadRequest(new { message });

        return Ok(new { message });
    }
}
