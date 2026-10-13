using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PocketMonkey.Storage.Migrations
{
    /// <inheritdoc />
    public partial class OpeningLedger : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "BalanceMinorUnits",
                table: "Accounts",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LedgerEntries",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    AccountId = table.Column<string>(type: "TEXT", nullable: false),
                    AmountMinorUnits = table.Column<long>(type: "INTEGER", nullable: false),
                    IdempotencyKey = table.Column<string>(type: "TEXT", nullable: false),
                    ActorId = table.Column<string>(type: "TEXT", nullable: false),
                    ActorDisplayName = table.Column<string>(type: "TEXT", nullable: false),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    Source = table.Column<string>(type: "TEXT", nullable: false),
                    Comment = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LedgerEntries", x => x.Id);
                    table.CheckConstraint("CK_LedgerEntries_Amount", "typeof(AmountMinorUnits) = 'integer' AND AmountMinorUnits >= 0");
                    table.CheckConstraint("CK_LedgerEntries_Comment", "Comment IS NULL OR length(Comment) <= 500");
                    table.CheckConstraint("CK_LedgerEntries_Key", "length(IdempotencyKey) = 36");
                    table.CheckConstraint("CK_LedgerEntries_Source", "Source = 'opening'");
                    table.ForeignKey(
                        name: "FK_LedgerEntries_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Accounts_Balance",
                table: "Accounts",
                sql: "BalanceMinorUnits IS NULL OR (typeof(BalanceMinorUnits) = 'integer' AND BalanceMinorUnits >= 0)");

            migrationBuilder.CreateIndex(
                name: "IX_LedgerEntries_AccountId",
                table: "LedgerEntries",
                column: "AccountId",
                unique: true,
                filter: "Source = 'opening'");

            migrationBuilder.CreateIndex(
                name: "IX_LedgerEntries_IdempotencyKey",
                table: "LedgerEntries",
                column: "IdempotencyKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LedgerEntries");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Accounts_Balance",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "BalanceMinorUnits",
                table: "Accounts");
        }
    }
}
