using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace Woodstop.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialStands : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Stands",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Town = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    State = table.Column<string>(type: "nvarchar(2)", maxLength: 2, nullable: false),
                    Location = table.Column<Point>(type: "geography", nullable: false),
                    AccessNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PublicationState = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    OperatingStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Price = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    PriceUnit = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    PriceObservedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    PaymentMethods = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    PaymentObservedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    SourceNote = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LocationVerifiedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    IsDemo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stands", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Stands");
        }
    }
}
