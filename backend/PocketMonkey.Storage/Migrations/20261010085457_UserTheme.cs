using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PocketMonkey.Storage.Migrations
{
    /// <inheritdoc />
    public partial class UserTheme : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Theme",
                table: "AspNetUsers",
                type: "TEXT",
                maxLength: 6,
                nullable: false,
                defaultValue: "system");

            migrationBuilder.AddCheckConstraint(
                name: "CK_AspNetUsers_Theme",
                table: "AspNetUsers",
                sql: "Theme IN ('system', 'light', 'dark')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_AspNetUsers_Theme",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Theme",
                table: "AspNetUsers");
        }
    }
}
