using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PocketMonkey.Storage.Migrations
{
    /// <inheritdoc />
    public partial class AccountLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AccountId",
                table: "RetiredLedgerKeys",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "DroppedAtUtc",
                table: "AllowanceExecutions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RetiredAtUtc",
                table: "Accounts",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PendingImageDeletions",
                columns: table => new
                {
                    ImageKey = table.Column<string>(type: "TEXT", maxLength: 36, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PendingImageDeletions", x => x.ImageKey);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RetiredLedgerKeys_AccountId",
                table: "RetiredLedgerKeys",
                column: "AccountId");

            migrationBuilder.AddCheckConstraint(
                name: "CK_AllowanceExecutions_Outcome",
                table: "AllowanceExecutions",
                sql: "CreditedAtUtc IS NULL OR DroppedAtUtc IS NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_RetiredLedgerKeys_Accounts_AccountId",
                table: "RetiredLedgerKeys",
                column: "AccountId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RetiredLedgerKeys_Accounts_AccountId",
                table: "RetiredLedgerKeys");

            migrationBuilder.DropTable(
                name: "PendingImageDeletions");

            migrationBuilder.DropIndex(
                name: "IX_RetiredLedgerKeys_AccountId",
                table: "RetiredLedgerKeys");

            migrationBuilder.DropCheckConstraint(
                name: "CK_AllowanceExecutions_Outcome",
                table: "AllowanceExecutions");

            migrationBuilder.DropColumn(
                name: "AccountId",
                table: "RetiredLedgerKeys");

            migrationBuilder.DropColumn(
                name: "DroppedAtUtc",
                table: "AllowanceExecutions");

            migrationBuilder.DropColumn(
                name: "RetiredAtUtc",
                table: "Accounts");
        }
    }
}
