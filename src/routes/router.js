import { Router } from "express";
import { createHelia, libp2pDefaults } from "helia";
import { createOrbitDB } from "@orbitdb/core";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";

const router = Router();



const initDb = async () => {
  const libp2pOptions = libp2pDefaults();
  libp2pOptions.services.pubsub = gossipsub({allowPublishToZeroTopicPeers: true})
  const helia_instance = await createHelia({ libp2p: libp2pOptions });
  const orbitdb = await createOrbitDB({ ipfs: helia_instance });
  const mydb = await orbitdb.open("mydb");
  console.log(mydb.address);
  const hash = await mydb.add("hello world!");
};
initDb();

export default router;
