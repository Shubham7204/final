using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartOfficeAPI.Data;
using SmartOfficeAPI.DTOs;
using SmartOfficeAPI.Models;

namespace SmartOfficeAPI.Controllers;

[ApiController]
[Route("api/resources")]
[Authorize]
public class ResourceController : ControllerBase
{
    private readonly AppDbContext _context;

    public ResourceController(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/resources?type=MeetingRoom&capacity=10&date=2026-03-10&startTime=14:00&endTime=15:00
    [HttpGet]
    public async Task<IActionResult> GetResources(
        [FromQuery] string? type,
        [FromQuery] int? capacity,
        [FromQuery] DateTime? date,
        [FromQuery] string? startTime,
        [FromQuery] string? endTime)
    {
        // Base query — active resources only
        var query = _context.Resources.Where(r => r.IsActive).AsQueryable();

        // LINQ filters
        if (!string.IsNullOrEmpty(type))
            query = query.Where(r => r.Type.ToLower() == type.ToLower());

        if (capacity.HasValue)
            query = query.Where(r => r.Capacity >= capacity.Value);

        var resources = await query
            .OrderBy(r => r.Type)
            .ThenBy(r => r.Name)
            .Select(r => new ResourceResponse
            {
                Id = r.Id, Name = r.Name, Type = r.Type,
                Capacity = r.Capacity, Location = r.Location, IsActive = r.IsActive
            })
            .ToListAsync();

        // Availability filter — exclude resources booked in the requested window
        if (date.HasValue && !string.IsNullOrEmpty(startTime) && !string.IsNullOrEmpty(endTime))
        {
            if (TimeSpan.TryParse(startTime, out var tsStart) && TimeSpan.TryParse(endTime, out var tsEnd))
            {
                var reqStart = DateTime.SpecifyKind(date.Value.Date.Add(tsStart), DateTimeKind.Utc);
                var reqEnd   = DateTime.SpecifyKind(date.Value.Date.Add(tsEnd),   DateTimeKind.Utc);

                var bookedIds = await _context.Bookings
                    .Where(b => b.Status == "Active" &&
                                b.StartTime < reqEnd &&
                                b.EndTime   > reqStart)
                    .Select(b => b.ResourceId)
                    .Distinct()
                    .ToListAsync();

                resources = resources.Where(r => !bookedIds.Contains(r.Id)).ToList();
            }
        }

        return Ok(resources);
    }

    // GET /api/resources/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetResource(int id)
    {
        var r = await _context.Resources.FindAsync(id);
        if (r == null) return NotFound(new { message = "Resource not found." });

        return Ok(new ResourceResponse
        {
            Id = r.Id, Name = r.Name, Type = r.Type,
            Capacity = r.Capacity, Location = r.Location, IsActive = r.IsActive
        });
    }

    // POST /api/resources  [Admin only]
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateResource([FromBody] CreateResourceRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Type))
            return BadRequest(new { message = "Name and Type are required." });

        var resource = new Resource
        {
            Name = request.Name.Trim(),
            Type = request.Type.Trim(),
            Capacity = request.Capacity,
            Location = request.Location.Trim(),
            IsActive = true
        };

        _context.Resources.Add(resource);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetResource), new { id = resource.Id }, new ResourceResponse
        {
            Id = resource.Id, Name = resource.Name, Type = resource.Type,
            Capacity = resource.Capacity, Location = resource.Location, IsActive = resource.IsActive
        });
    }

    // PUT /api/resources/{id}  [Admin only]
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateResource(int id, [FromBody] UpdateResourceRequest request)
    {
        var resource = await _context.Resources.FindAsync(id);
        if (resource == null) return NotFound(new { message = "Resource not found." });

        if (request.Name     != null) resource.Name     = request.Name.Trim();
        if (request.Type     != null) resource.Type     = request.Type.Trim();
        if (request.Capacity.HasValue) resource.Capacity = request.Capacity.Value;
        if (request.Location != null) resource.Location = request.Location.Trim();
        if (request.IsActive.HasValue) resource.IsActive = request.IsActive.Value;

        await _context.SaveChangesAsync();

        return Ok(new ResourceResponse
        {
            Id = resource.Id, Name = resource.Name, Type = resource.Type,
            Capacity = resource.Capacity, Location = resource.Location, IsActive = resource.IsActive
        });
    }

    // DELETE /api/resources/{id}  [Admin only] — soft delete
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteResource(int id)
    {
        var resource = await _context.Resources.FindAsync(id);
        if (resource == null) return NotFound(new { message = "Resource not found." });

        resource.IsActive = false;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"'{resource.Name}' has been deactivated." });
    }
}
