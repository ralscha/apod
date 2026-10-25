package ch.rasc.apod;

import static org.junit.jupiter.api.Assertions.*;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import jetbrains.exodus.ArrayByteIterable;
import jetbrains.exodus.bindings.StringBinding;
import jetbrains.exodus.env.*;
import ch.rasc.apod.entity.Apod;

class KryoStoreTest {
    @TempDir Path directory;

    private Apod sample() {
        Apod value = new Apod();
        value.setDate("2026-10-25"); value.setExplanation("A star — 星 🌟");
        value.setHdUrl(null); value.setMediaType("image"); value.setTitle("Repeated");
        value.setUrl("https://example.com/image"); value.setCredit("Repeated"); return value;
    }

    private void seed(Environment env, boolean corrupt) {
        env.executeInTransaction(txn -> {
            Store store = env.openStore("apod", StoreConfig.WITHOUT_DUPLICATES, txn);
            com.esotericsoftware.kryo.Kryo kryo = new com.esotericsoftware.kryo.Kryo();
            kryo.register(Apod.class);
            try (com.esotericsoftware.kryo.io.Output output = new com.esotericsoftware.kryo.io.Output(32, -1)) {
                kryo.writeObject(output, sample());
                store.put(txn, StringBinding.stringToEntry("first"), new ArrayByteIterable(output.toBytes()));
            }
            if (corrupt) {
                store.put(txn, StringBinding.stringToEntry("second"), new ArrayByteIterable(new byte[0]));
            }
        });
    }

    @Test void migratesRealKryo4BytesAndPreservesEveryField() {
        try (Environment env = Environments.newInstance(directory.toFile())) {
            seed(env, false);
            KryoStore.migrate(env);
            env.executeInReadonlyTransaction(txn -> {
                Store target = env.openStore(KryoStore.STORE, StoreConfig.WITHOUT_DUPLICATES, txn);
                ArrayByteIterable bytes = new ArrayByteIterable(target.get(txn, StringBinding.stringToEntry("first")));
                try (com.esotericsoftware.kryo.kryo5.io.Input input = new com.esotericsoftware.kryo.kryo5.io.Input(bytes.getBytesUnsafe(), 0, bytes.getLength())) {
                    Apod actual = KryoStore.newKryo().readObject(input, Apod.class);
                    assertEquals(sample().getDate(), actual.getDate());
assertEquals(sample().getExplanation(), actual.getExplanation());
assertEquals(sample().getHdUrl(), actual.getHdUrl());
assertEquals(sample().getMediaType(), actual.getMediaType());
assertEquals(sample().getTitle(), actual.getTitle());
assertEquals(sample().getUrl(), actual.getUrl());
assertEquals(sample().getCredit(), actual.getCredit());
                    assertEquals(bytes.getLength(), input.position());
                }
                assertEquals(1L, target.count(txn));
                assertEquals(1L, env.openStore("apod", StoreConfig.WITHOUT_DUPLICATES, txn).count(txn));
            });
        }
    }

    @Test void restartDoesNotReimportDeletedRecords() {
        try (Environment env = Environments.newInstance(directory.toFile())) {
            seed(env, false);
            KryoStore.migrate(env);
            env.executeInTransaction(txn -> env.truncateStore(KryoStore.STORE, txn));
        }
        try (Environment env = Environments.newInstance(directory.toFile())) {
            KryoStore.migrate(env);
            env.executeInReadonlyTransaction(txn -> assertEquals(0L,
                    env.openStore(KryoStore.STORE, StoreConfig.WITHOUT_DUPLICATES, txn).count(txn)));
        }
    }

    @Test void corruptLegacyRecordRollsBackTheEntireMigration() {
        try (Environment env = Environments.newInstance(directory.toFile())) {
            seed(env, true);
            assertThrows(RuntimeException.class, () -> KryoStore.migrate(env));
            env.executeInReadonlyTransaction(txn -> {
                assertFalse(env.storeExists(KryoStore.STORE, txn));
                assertEquals(2L, env.openStore("apod", StoreConfig.WITHOUT_DUPLICATES, txn).count(txn));
            });
        }
    }

    @Test void initializesAnEmptyDatabaseAndIsIdempotent() {
        try (Environment env = Environments.newInstance(directory.toFile())) {
            KryoStore.migrate(env);
            KryoStore.migrate(env);
            env.executeInReadonlyTransaction(txn -> assertEquals(0L,
                    env.openStore(KryoStore.STORE, StoreConfig.WITHOUT_DUPLICATES, txn).count(txn)));
        }
    }
}
