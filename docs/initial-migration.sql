IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [Stands] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(160) NOT NULL,
    [Description] nvarchar(2000) NOT NULL,
    [Town] nvarchar(120) NOT NULL,
    [State] nvarchar(2) NOT NULL,
    [Location] geography NOT NULL,
    [AccessNotes] nvarchar(max) NULL,
    [PublicationState] nvarchar(20) NOT NULL,
    [OperatingStatus] nvarchar(20) NOT NULL,
    [Price] decimal(10,2) NULL,
    [PriceUnit] nvarchar(80) NULL,
    [PriceObservedAt] datetimeoffset NULL,
    [PaymentMethods] nvarchar(300) NULL,
    [PaymentObservedAt] datetimeoffset NULL,
    [SourceNote] nvarchar(max) NOT NULL,
    [LocationVerifiedAt] datetimeoffset NOT NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [UpdatedAt] datetimeoffset NOT NULL,
    [IsDemo] bit NOT NULL,
    CONSTRAINT [PK_Stands] PRIMARY KEY ([Id])
);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261108174638_InitialStands', N'10.0.14');

COMMIT;
GO

