package ch.rasc.apod;

import java.util.function.Function;
import com.esotericsoftware.kryo.Kryo;
import com.esotericsoftware.kryo.util.Pool;
import ch.rasc.apod.entity.Apod;

/**
 * Owns the versioned store name and a pool of reusable Kryo instances. The name carries
 * the serialization format version so records written by an incompatible Kryo version are
 * never read with the current one.
 */
final class KryoStore {
    static final String STORE = "apod-kryo5";
    private final Pool<Kryo> pool = new Pool<>(true, true) {
        @Override
        protected Kryo create() {
            return newKryo();
        }
    };

    private static Kryo newKryo() {
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
}
