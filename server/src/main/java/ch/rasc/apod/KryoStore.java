package ch.rasc.apod;

import java.util.function.Function;
import com.esotericsoftware.kryo.kryo5.Kryo;
import com.esotericsoftware.kryo.kryo5.io.Output;
import com.esotericsoftware.kryo.kryo5.util.Pool;
import jetbrains.exodus.ArrayByteIterable;
import jetbrains.exodus.env.Cursor;
import jetbrains.exodus.env.Environment;
import jetbrains.exodus.env.Store;
import jetbrains.exodus.env.StoreConfig;
import ch.rasc.apod.entity.Apod;

/** Owns the versioned Kryo 5 store; Kryo 4 is used only to read the original store. */
final class KryoStore {
    static final String STORE = "apod-kryo5";
    private final Pool<Kryo> pool = new Pool<>(true, true) {
        @Override
        protected Kryo create() {
            return newKryo();
        }
    };

    static Kryo newKryo() {
        Kryo kryo = new Kryo();
        kryo.register(Apod.class);

        return kryo;
    }

    Kryo borrow() { return this.pool.obtain(); }
    void release(Kryo kryo) { this.pool.free(kryo); }
    <T> T run(Function<Kryo, T> action) {
        Kryo kryo = borrow();
        try { return action.apply(kryo); }
        finally { release(kryo); }
    }

    static void migrate(Environment environment) {
        environment.executeInTransaction(txn -> {
            if (environment.storeExists(STORE, txn)) {
                return;
            }
            Store target = environment.openStore(STORE, StoreConfig.WITHOUT_DUPLICATES, txn);
            if (!environment.storeExists("apod", txn)) {
                return;
            }
            Store legacy = environment.openStore("apod", StoreConfig.WITHOUT_DUPLICATES, txn);
            com.esotericsoftware.kryo.Kryo reader = new com.esotericsoftware.kryo.Kryo();
            reader.register(Apod.class);
            Kryo writer = newKryo();
            try (Cursor cursor = legacy.openCursor(txn)) {
                while (cursor.getNext()) {
                    ArrayByteIterable bytes = new ArrayByteIterable(cursor.getValue());
                    try (com.esotericsoftware.kryo.io.Input input = new com.esotericsoftware.kryo.io.Input(
                            bytes.getBytesUnsafe(), 0, bytes.getLength());
                         Output output = new Output(32, -1)) {
                        Apod record = reader.readObject(input, Apod.class);
                        if (input.position() != bytes.getLength()) {
                            throw new IllegalStateException("Trailing bytes in legacy Kryo record; migration aborted");
                        }
                        writer.writeObject(output, record);
                        target.put(txn, cursor.getKey(), new ArrayByteIterable(output.toBytes()));
                    }
                }
            }
            if (target.count(txn) != legacy.count(txn)) {
                throw new IllegalStateException("Kryo migration count mismatch");
            }
            // Creation and the entire copy commit together. Failure leaves the old store untouched.
        });
    }
}
