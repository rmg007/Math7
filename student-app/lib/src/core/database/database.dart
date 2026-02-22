// ignore_for_file: depend_on_referenced_packages

import 'dart:io';
import 'dart:math';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqlcipher_flutter_libs/sqlcipher_flutter_libs.dart';
import 'package:sqlite3/open.dart';

import 'tables.dart';

part 'database.g.dart';

// ---------------------------------------------------------------------------
// F-15: SQLCipher Encryption
// ---------------------------------------------------------------------------
// The DB encryption key is a 64-hex-char (32-byte) cryptographically-random
// value stored in the OS secure keychain via flutter_secure_storage.
// It is generated once on first launch and never stored in plain-text.
// ---------------------------------------------------------------------------

const _kDbKeyStorageKey = 'questerix_db_encryption_key';

/// Configure SQLCipher native library loading.
///
/// On Android, SQLCipher ships its own `libsqlcipher.so` and we must tell
/// the sqlite3 Dart package to load *that* instead of the system
/// `libsqlite3.so`.  This must be called before opening any database and,
/// when using background isolates, also on the background isolate.
Future<void> setupSqlCipher() async {
  if (Platform.isAndroid) {
    await applyWorkaroundToOpenSqlCipherOnOldAndroidVersions();
    open.overrideFor(OperatingSystem.android, openCipherOnAndroid);
  }
  // iOS/macOS/Windows: sqlcipher_flutter_libs handles it automatically.
  // Linux: OpenSSL is statically linked by default in sqlcipher_flutter_libs.
}

/// Returns the 64-char hex encryption key from the OS keychain, generating
/// and persisting a new random key if one does not exist yet.
Future<String> _getOrCreateEncryptionKey() async {
  const storage = FlutterSecureStorage(
    // Android: use EncryptedSharedPreferences backed by the Android Keystore.
    // ignore: deprecated_member_use
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    // iOS: keep the key accessible after the first unlock (survives restart).
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  String? key = await storage.read(key: _kDbKeyStorageKey);
  if (key == null) {
    // Generate a 32-byte cryptographically-random key and hex-encode it.
    final rng = Random.secure();
    key = List.generate(32, (_) => rng.nextInt(256))
        .map((b) => b.toRadixString(16).padLeft(2, '0'))
        .join();
    await storage.write(key: _kDbKeyStorageKey, value: key);
  }
  return key;
}

/// Opens the encrypted native database file.
QueryExecutor _openConnection() {
  if (kIsWeb) {
    // Web: SQLCipher is not available on this platform.
    // Data protection relies on browser same-origin isolation.
    if (kDebugMode) {
      // ignore: avoid_print
      print(
        '[F-15] SQLCipher unavailable on Web — DB is NOT encrypted on this platform.',
      );
    }
    return NativeDatabase.memory();
  }

  // Use a LazyDatabase so that async setup (keychain access) can happen
  // before the first query.
  return LazyDatabase(() async {
    final dbKey = await _getOrCreateEncryptionKey();
    final dbDir = await getApplicationDocumentsDirectory();
    final dbFile = File(p.join(dbDir.path, 'questerix.db'));

    // Capture the root isolate token so BackgroundIsolateBinaryMessenger
    // can be initialised on the database background isolate (needed for
    // the Android platform channel called by setupSqlCipher).
    final rootToken = ServicesBinding.rootIsolateToken!;

    return NativeDatabase.createInBackground(
      dbFile,
      isolateSetup: () async {
        // Re-initialise the binary messenger on the spawned isolate.
        BackgroundIsolateBinaryMessenger.ensureInitialized(rootToken);
        await setupSqlCipher();
      },
      setup: (rawDb) {
        // Apply the encryption passphrase — MUST be first statement.
        rawDb.execute("PRAGMA key = '$dbKey';");
        // Disable double-quoted string literals for consistency with the
        // compile-time setting used by sqlite3_flutter_libs.
        rawDb.config.doubleQuotedStringLiterals = false;
      },
    );
  });
}

// ---------------------------------------------------------------------------
// AppDatabase
// ---------------------------------------------------------------------------

@DriftDatabase(tables: [
  Domains,
  Skills,
  Questions,
  Attempts,
  Sessions,
  SkillProgress,
  Outbox,
  SyncMeta,
  CurriculumMeta,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? e]) : super(e ?? _openConnection());

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration {
    return MigrationStrategy(
      onCreate: (Migrator m) async {
        await m.createAll();
      },
      onUpgrade: (Migrator m, int from, int to) async {
        // Handle schema migrations here when upgrading versions.
      },
    );
  }
}
