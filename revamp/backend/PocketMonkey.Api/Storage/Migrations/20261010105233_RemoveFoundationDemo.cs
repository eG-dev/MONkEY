using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PocketMonkey.Api.Storage.Migrations
{
    /// <inheritdoc />
    public partial class RemoveFoundationDemo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FoundationState");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FoundationState",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    InitializedAtUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    SampleId = table.Column<string>(type: "TEXT", maxLength: 36, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FoundationState", x => x.Id);
                    table.CheckConstraint("CK_FoundationState_Singleton", "Id = 1");
                });
        }
    }
}
