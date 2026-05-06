using BankApi.DTOs;
using BankApi.Models;
using BankApi.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace BankApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly MongoDbService _db;
    private readonly JwtService _jwtService;

    public AuthController(MongoDbService db, JwtService jwtService)
    {
        _db = db;
        _jwtService = jwtService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        var existingUser = await _db.Users.Find(u => u.Email == req.Email.ToLower()).FirstOrDefaultAsync();
        if (existingUser != null)
        {
            return UnprocessableEntity(new { message = "User already exists with this email.", status = "failed" });
        }

        var user = new User
        {
            Email = req.Email.ToLower().Trim(),
            Name = req.Name,
            Password = BCrypt.Net.BCrypt.HashPassword(req.Password)
        };

        await _db.Users.InsertOneAsync(user);

        var token = _jwtService.GenerateToken(user.Id!);
        Response.Cookies.Append("token", token);

        return Created("", new
        {
            user = new { _id = user.Id, email = user.Email, name = user.Name },
            token
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var user = await _db.Users.Find(u => u.Email == req.Email.ToLower()).FirstOrDefaultAsync();
        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.Password))
        {
            return Unauthorized(new { message = "Email or password is INVALID" });
        }

        var token = _jwtService.GenerateToken(user.Id!);
        Response.Cookies.Append("token", token);

        return Ok(new
        {
            user = new { _id = user.Id, email = user.Email, name = user.Name },
            token
        });
    }
}
