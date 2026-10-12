using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PocketMonkey.Api.Storage.Migrations
{
    /// <inheritdoc />
    public partial class AccountImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageKey",
                table: "Accounts",
                type: "TEXT",
                maxLength: 36,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageKey",
                table: "Accounts");
        }
    }
}
