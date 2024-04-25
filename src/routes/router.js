import { Router } from "express";
import { createOrbitDB, IPFSAccessController } from "@orbitdb/core";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { createHelia, libp2pDefaults } from "helia";
import { LevelBlockstore } from "blockstore-level";
import { LevelDatastore } from "datastore-level";
import multer from "multer";
import { unixfs } from "@helia/unixfs";
import { multiaddr } from "@multiformats/multiaddr";
import { circuitRelayServer } from "libp2p/circuit-relay";

const router = Router();
const upload = multer();
const encoder = new TextEncoder();

async function initIPFSInstance(dirLevel, dirBlock) {
  const blockstore = new LevelBlockstore(`./src/routes/${dirBlock}`);
  const datastore = new LevelDatastore(`./src/routes/${dirLevel}`);
  await blockstore.open();
  await datastore.open();

  const libp2pOptions = libp2pDefaults(); // {peerId: id}
  libp2pOptions.services.pubsub = gossipsub({
    allowPublishToZeroTopicPeers: true,
  });

  const helia = await createHelia({
    libp2p: libp2pOptions,
    blockstore: blockstore,
    datastore: datastore,
  });

  const fs = unixfs(helia);
  return { helia: helia, fs: fs };
}

const { helia: ipfs1, fs: fs1 } = await initIPFSInstance("level1", "block1");
const { helia: ipfs2, fs: fs2 } = await initIPFSInstance("level2", "block2");

const orbitdb1 = await createOrbitDB({
  ipfs: ipfs1,
  directory: "./src/routes/orbitdb1",
});
const orbitdb2 = await createOrbitDB({
  ipfs: ipfs2,
  directory: "./src/routes/orbitdb2",
});

const db1 = await orbitdb1.open("my-db", {
  type: "documents",
  AccessController: IPFSAccessController({ write: ["*"] }),
});

const db2 = await orbitdb2.open(db1.address);

router.post("/upload", async (req, res) => {
  // for await (const { key, value } of ipfs1.datastore.query({})) {
  //   console.log(key.toString());
  // }
  const { helia: ipfs1, fs: fs1 } = await initIPFSInstance("level1", "block1");
  const name = req.body.id
  const data = req.body.plan
  console.log(data);
  const CID = await fs1.addFile({ path: `/${data.title}`, content: encoder.encode(JSON.stringify(data, null, 2)) });
  await ipfs1.datastore.put(`/${name}/${CID}`, encoder.encode(JSON.stringify(data, null, 2)));
  await db1.put({ _id: name, content: encoder.encode(JSON.stringify(data, null, 2)), path: `/${data.title}/${CID}`});
  res.status(200).json({ path: `/${name}`, cid: CID });
});

router.get("/all", async (req, res) => {
  let idsLocal = [];
  let idsOrbit = [];
  for await (const { key, value } of ipfs1.datastore.query({})) {
    idsLocal.push(key.toString());
  }
  for await (const record of db2.iterator()) {
    idsOrbit.push(record);
  }
  res.status(200).json({ Helia: idsLocal, Orbit: idsOrbit });
});

router.delete("/del/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const doc = await db1.get(id);
    if (doc == undefined) {
      throw new Error("Document does not exists");
    }
    await ipfs1.datastore.delete(new String(doc.value.path.split("/")[2]))
    await db1.del(id);
    res.status(200).json({ message: "Document deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

db2.events.on("update", (entry) => {
  console.log(entry);
});

// await db1.close();
// await db2.close();
// await orbitdb1.stop();
// await orbitdb2.stop()
// await ipfs1.stop();
// await ipfs2.stop()

export default router;
