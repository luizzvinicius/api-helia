import { Router } from 'express'
import { createHelia } from 'helia'
import multer from 'multer'
import { unixfs } from '@helia/unixfs'
import { CID } from 'multiformats/cid'
import { multiaddr } from '@multiformats/multiaddr'

const router = Router()
const upload = multer()

async function createNode() {
    const helia = await createHelia()
    const fs = unixfs(helia)
    // let file = await helia.blockstore.get(CID.parse("bafkreihp3ltrud3rxtrllncjfmis2qf6vlwop3dd3vbvrxprg47rnhmmce"))
    // console.log(file.toString()) // recuperar arquivo por CID
    return fs
}
const fs = await createNode()
let hashMap = new Map()
router.post("/upload", upload.single('file'), async (req, res) => {
    const data = req.file.buffer
    const CID = await fs.addBytes(data)
    hashMap.set(req.file.originalname, CID)

    res.status(200).json({ message: 'File upload', cid: CID })
})

router.get("/", async (req, res) => {
    const fileName = req.body.fileName
    const CID = hashMap.get(fileName)
    if (!CID) {
        res.status(404).json({ message: "File not found" })
        return
    }

    let text = ''
    for await (const buffer of fs.cat(CID)) {
        text += buffer
    }
    res.status(200).json({ texto: text, cid: CID })
})

// // tentativa de se conectar a um nó
// const conn = await helia.libp2p.dial(multiaddr("/ip4/127.0.0.1/tcp/4001/p2p/12D3KooWSWHtC7CAWFKUuNhFUvTo4nSh6YF7hkRsCqMSuPbAty8F")) // esse endereço sempre muda    
// let stream = await conn.newStream('/ipfs/bitswap/1.0.0')

// const data = new TextEncoder().encode('Hello, world!')
// try {
//     // await stream.sink.call(data, { signal: stream.close() })
//     let dados = await stream.source.return(data)
//     console.log(dados)
//     await stream.sink([dados.value])
//     console.log("aqui")
// } catch (error) {
//     console.log(error)
// }

export default router