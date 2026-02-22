import 'dart:io';
import 'dart:math';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqlcipher_flutter_libs/sqlcipher_flutter_libs.dart';
import 'package:sqlite3/open.dart';

const _kDbKeyStorageKey = 'questerix_db_encryption_key';

Future<void> setupSqlCipher() async {
  if (Platform.isAndroid) {
    await applyWorkaroundToOpenSqlCipherOnOldAndroidVersions();
    open.overrideFor(OperatingSystem.android, openCipherOnAndroid);
  }
}

Future<String> _getOrCreateEncryptionKey() async {
  const storage = FlutterSecureStorage(
    // ignore: deprecated_member_use
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  String? key = await storage.read(key: _kDbKeyStorageKey);
  if (key == null) {
    final rng = Random.secure();
    key = List.generate(32, (_) => rng.nextInt(256))
        .map((b) => b.toRadixString(16).padLeft(2, '0'))
        .join();
    await storage.write(key: _kDbKeyStorageKey, value: key);
  }
  return key;
}

QueryExecutor openConnection() {
  return LazyDatabase(() async {
    final dbKey = await _getOrCreateEncryptionKey();
    final dbDir = await getApplicationDocumentsDirectory();
    final dbFile = File(p.join(dbDir.path, 'questerix.db'));

    final rootToken = ServicesBinding.rootIsolateToken!;

    return NativeDatabase.createInBackground(
      dbFile,
      isolateSetup: () async {
        BackgroundIsolateBinaryMessenger.ensureInitialized(rootToken);
        await setupSqlCipher();
      },
      setup: (rawDb) {
        rawDb.execute("PRAGMA key = '$dbKey';");
        rawDb.config.doubleQuotedStringLiterals = false;
      },
    );
  });
}
