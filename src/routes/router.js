import { Router } from "express";
import { createHelia, libp2pDefaults } from "helia";
import { createOrbitDB, IPFSAccessController } from "@orbitdb/core";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { LevelBlockstore } from 'blockstore-level'
import { unixfs } from '@helia/unixfs'

const router = Router();
const encoder = new TextEncoder()
const decoder = new TextDecoder()

const initIPFSInstance = async () => {
  const libp2pOptions = libp2pDefaults()
  libp2pOptions.services.pubsub = gossipsub({allowPublishToZeroTopicPeers: true})
  // const blockstore = new LevelBlockstore('./ipfs')
  const helia = await createHelia({libp2p: libp2pOptions})
  const fs = unixfs(helia)
  return helia
}

let databasename = "zdpuB2aYUCnZ7YUBrDkCWpRLQ8ieUbqJEVRZEd5aDhJBDpBqj"
const initDb = async () => {  
  const helia_instance = await initIPFSInstance();
  const orbitdb = await createOrbitDB({ ipfs: helia_instance, directory: `./orbitdb/${databasename}` });
  const mydb = await orbitdb.open("my-db", { AccessController: IPFSAccessController({ write: ['*']}) });
  // const mydb = await orbitdb.open(`/orbitdb/${databasename}`, { AccessController: IPFSAccessController({ write: ['*']}) });
  console.log(mydb.address);
  // await mydb.add("hello world!");
  console.log(await mydb.all())
};
initDb();

export default router;
