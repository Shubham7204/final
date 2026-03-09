namespace SmartOfficeAPI.Models;

public class Resource
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "MeetingRoom" | "Desk" | "Equipment"
    public int Capacity { get; set; }
    public string Location { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
