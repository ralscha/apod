package ch.rasc.apod;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.esotericsoftware.kryo.Kryo;
import com.esotericsoftware.kryo.io.Input;
import com.esotericsoftware.kryo.io.Output;
import com.esotericsoftware.kryo.pool.KryoFactory;
import com.esotericsoftware.kryo.pool.KryoPool;
import jakarta.annotation.PreDestroy;
import ch.rasc.apod.config.AppProperties;
import ch.rasc.apod.entity.Apod;
import jetbrains.exodus.ArrayByteIterable;
import jetbrains.exodus.ByteIterable;
import jetbrains.exodus.bindings.StringBinding;
import jetbrains.exodus.env.Cursor;
import jetbrains.exodus.env.Environment;
import jetbrains.exodus.env.Environments;
import jetbrains.exodus.env.Store;
import jetbrains.exodus.env.StoreConfig;

@Component
public class ExodusManager {

	private static final String APOD_STORE = "apod";

	private final Environment environment;

	private final KryoPool kryoPool;

	@Autowired
	public ExodusManager(AppProperties appProperties) {
		this.environment = Environments.newInstance(appProperties.getXodusPath());

		KryoFactory factory = () -> {
			Kryo kryo = new Kryo();
			kryo.register(Apod.class);
			return kryo;
		};
		this.kryoPool = new KryoPool.Builder(factory).softReferences().build();
	}

	@PreDestroy
	public void destroy() {
		if (this.environment != null) {
			this.environment.close();
		}
	}

	public void deleteStore() {
		this.environment.executeInTransaction(txn -> {
			if (this.environment.storeExists(APOD_STORE, txn)) {
				this.environment.removeStore(APOD_STORE, txn);
			}
		});
	}

	public void saveApod(Apod apod) {
		this.environment.executeInTransaction(txn -> {

			Store store = this.environment.openStore(APOD_STORE, StoreConfig.WITHOUT_DUPLICATES, txn);

			Kryo kryo = this.kryoPool.borrow();
			try {
				@SuppressWarnings("resource")
				Output output = new Output(32, -1);
				kryo.writeObject(output, apod);
				output.close();
				store.put(txn, StringBinding.stringToEntry(apod.getDate()), new ArrayByteIterable(output.toBytes()));
			}
			finally {
				this.kryoPool.release(kryo);
			}

		});
	}

	public void deleteApod(Apod apod) {
		this.environment.executeInTransaction(txn -> {
			Store store = this.environment.openStore(APOD_STORE, StoreConfig.WITHOUT_DUPLICATES, txn);
			store.delete(txn, StringBinding.stringToEntry(apod.getDate()));
		});
	}

	public Apod readApod(final String date) {
		return this.environment.computeInReadonlyTransaction(txn -> {
			if (this.environment.storeExists(APOD_STORE, txn)) {
				Store store = this.environment.openStore(APOD_STORE, StoreConfig.WITHOUT_DUPLICATES, txn);
				try (Cursor cursor = store.openCursor(txn)) {
					ByteIterable value = cursor.getSearchKey(StringBinding.stringToEntry(date));
					if (value != null) {
						ArrayByteIterable abi = new ArrayByteIterable(value);
						return this.kryoPool.run(kryo -> {
							try (Input input = new Input(abi.getBytesUnsafe(), 0, abi.getLength())) {
								return kryo.readObject(input, Apod.class);
							}
						});
					}
				}
			}
			return null;
		});
	}

	public List<Apod> readAllApod() {
		return this.environment.computeInReadonlyTransaction(txn -> {
			if (this.environment.storeExists(APOD_STORE, txn)) {
				Store store = this.environment.openStore(APOD_STORE, StoreConfig.WITHOUT_DUPLICATES, txn);
				List<Apod> result = new ArrayList<>();
				try (Cursor cursor = store.openCursor(txn)) {
					while (cursor.getNext()) {
						ByteIterable value = cursor.getValue();
						Apod apod = this.kryoPool.run(kryo -> {
							ArrayByteIterable abi = new ArrayByteIterable(value);
							try (Input input = new Input(abi.getBytesUnsafe(), 0, abi.getLength())) {
								return kryo.readObject(input, Apod.class);
							}
						});
						result.add(apod);
					}
				}
				return result;
			}
			return Collections.emptyList();
		});
	}

	public List<Apod> readApodFrom(String fromDate) {
		return this.environment.computeInReadonlyTransaction(txn -> {
			if (this.environment.storeExists(APOD_STORE, txn)) {
				Store store = this.environment.openStore(APOD_STORE, StoreConfig.WITHOUT_DUPLICATES, txn);
				List<Apod> result = new ArrayList<>();
				try (Cursor cursor = store.openCursor(txn)) {

					ByteIterable value = cursor.getSearchKeyRange(StringBinding.stringToEntry(fromDate));
					if (value != null) {
						Apod apod = this.kryoPool.run(kryo -> {
							ArrayByteIterable abi = new ArrayByteIterable(value);
							try (Input input = new Input(abi.getBytesUnsafe(), 0, abi.getLength())) {
								return kryo.readObject(input, Apod.class);
							}
						});
						result.add(apod);

						while (cursor.getNext()) {
							ByteIterable bi = cursor.getValue();
							apod = this.kryoPool.run(kryo -> {
								ArrayByteIterable abi = new ArrayByteIterable(bi);
								try (Input input = new Input(abi.getBytesUnsafe(), 0, abi.getLength())) {
									return kryo.readObject(input, Apod.class);
								}
							});
							result.add(apod);
						}
					}
				}
				return result;
			}
			return Collections.emptyList();
		});
	}

}
