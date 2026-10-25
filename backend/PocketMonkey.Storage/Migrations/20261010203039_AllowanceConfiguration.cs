using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PocketMonkey.Storage.Migrations
{
    /// <inheritdoc />
    public partial class AllowanceConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AllowanceRevisions",
                columns: table => new
                {
                    SequenceNumber = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Id = table.Column<string>(type: "TEXT", nullable: true),
                    AccountId = table.Column<string>(type: "TEXT", nullable: false),
                    PreviousRevisionId = table.Column<string>(type: "TEXT", nullable: false),
                    ActorId = table.Column<string>(type: "TEXT", nullable: false),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    EffectiveMonth = table.Column<int>(type: "INTEGER", nullable: false),
                    Enabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    AmountMinorUnits = table.Column<long>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AllowanceRevisions", x => x.SequenceNumber);
                    table.CheckConstraint("CK_AllowanceRevisions_Amount", "(AmountMinorUnits IS NULL AND Enabled = 0) OR (typeof(AmountMinorUnits) = 'integer' AND AmountMinorUnits > 0)");
                    table.CheckConstraint("CK_AllowanceRevisions_Month", "EffectiveMonth BETWEEN 101 AND 999912 AND EffectiveMonth % 100 BETWEEN 1 AND 12");
                    table.ForeignKey(
                        name: "FK_AllowanceRevisions_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AllowanceRevisions_AccountId_PreviousRevisionId",
                table: "AllowanceRevisions",
                columns: new[] { "AccountId", "PreviousRevisionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AllowanceRevisions_Id",
                table: "AllowanceRevisions",
                column: "Id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AllowanceRevisions");
        }
    }
}
