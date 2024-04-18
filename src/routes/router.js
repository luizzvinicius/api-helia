import { Router } from "express";
import { createOrbitDB, IPFSAccessController, Documents } from "@orbitdb/core";
import { bootstrap } from '@libp2p/bootstrap'
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { identify } from "@libp2p/identify";
import { createHelia, libp2pDefaults } from "helia";
import { LevelBlockstore } from "blockstore-level";
import { LevelDatastore } from "datastore-level";
import { createSecp256k1PeerId } from "@libp2p/peer-id-factory";
import { IDBDatastore } from 'datastore-idb'
import { peerID } from "../peerId.js";

const router = Router();

const initIPFSInstance = async (dirLevel, dirBlock) => {
  const blockstore = new LevelBlockstore(`./src/routes/${dirBlock}`);
  // const store = new IDBDatastore(`./src/routes/helia_${dirBlock}`);
  const datastore = new LevelDatastore(`./src/routes/${dirLevel}`);
  await blockstore.open();
  await datastore.open();
  
  // const id = await createSecp256k1PeerId()
  // console.log(id);
  const libp2pOptions = libp2pDefaults(); // {peerId: id}
  libp2pOptions.services.pubsub = gossipsub({
    allowPublishToZeroTopicPeers: true,
  });

  // const libp2pOptions = {
  //   services: {
  //     pubsub: gossipsub({
  //       allowPublishToZeroPeers: true
  //     }),
  //     identify: identify()
  //   },
  //   peerDiscovery: [
  //     bootstrap({
  //       list: [
  //         `/ip4/127.0.0.1/tcp/9091/ws/p2p/asdfasdf`
  //       ]
  //     })
  //   ]
  // }
  const helia = await createHelia({
    libp2p: libp2pOptions,
    blockstore: blockstore,
    datastore: datastore,
  });
  return helia;
};

const ipfs1 = await initIPFSInstance("level1", "block1");
// const ipfs2 = await initIPFSInstance("level2", "block2");

const orbitdb1 = await createOrbitDB({
  ipfs: ipfs1,
  directory: "./src/routes/orbitdb1"
});
// const orbitdb2 = await createOrbitDB({
//   ipfs: ipfs2,
//   id: "user2",
//   directory: "./src/routes/orbitdb2",
// });

const db1 = await orbitdb1.open("my-db", {
  type: "documents", AccessController: IPFSAccessController({ write: ["*"] }),
});

// const db2 = await orbitdb2.open(db1.address, { AccessController: IPFSAccessController({ write: ['*']})});
await db1.put({indexCustom:'indexCustom', content:'teste document db'});

for await (const record of db1.iterator()) {
  console.log(record);
}

await db1.close()
// await db2.close()
await orbitdb1.stop()
// await orbitdb2.stop()
await ipfs1.stop()
// await ipfs2.stop()

export default router;
