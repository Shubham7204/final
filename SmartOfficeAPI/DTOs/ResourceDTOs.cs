namespace SmartOfficeAPI.DTOs;

// ── Request DTOs ──────────────────────────────────────────────────────────────

public class CreateResourceRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // MeetingRoom | Desk | Equipment
    public int Capacity { get; set; }
    public string Location { get; set; } = string.Empty;
}

public class UpdateResourceRequest
{
    public string? Name { get; set; }
    public string? Type { get; set; }
    public int? Capacity { get; set; }
    public string? Location { get; set; }
    public bool? IsActive { get; set; }
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

public class ResourceResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string Location { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
