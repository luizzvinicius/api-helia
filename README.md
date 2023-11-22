# Documentação API com IPFS
Mais precisamente do arquivo routes/router.js

## Siglas
 - CID: content identifier (sha-256), mas não é o hash do arquivo
 - Helia: implementação do IPFS em js
 - UnixFS: sistema de arquivo

## Imports necessários
 - import multer from  'multer' (lida com upload de arquivos nas requisições. Nada relacionado ao IPFS)
 - import { createHelia } from  'helia' (função que cria um nó)
 - import { unixfs } from  '@helia/unixfs'
 - import { CID } from  'multiformats/cid' (formatação de CIDs)
 - import { multiaddr } from '@multiformats/multiaddr' (formatação de endereços IPFS. String -> PeerId)

## Descrição do código
### Criar um nó
    async function createNode() {
	    const helia = await createHelia()
	    const fs = unixfs(helia) // Cria um UnixFS para esse nó
	    return fs
	}
	// Sempre será gerado um Id diferente para o nó

### Rota /upload
    const data = req.file.buffer {Recebe o arquivo da requisição}
    const CID = await fs.addBytes(data) {Gera um CID}
    hashMap.set(req.file.originalname, CID)

### Rota /
    const fileName = req.body.fileName {Recebe o nome do arquivo}
    const CID = hashMap.get(fileName) {Pesquisa no hashMap e retorna o CID}
    {...}
    let text  =  ''
    for await (const buffer of fs.cat(CID)) {
	    text += buffer {.cat(CID) gera um iterator com os bytes relacionados ao CID}
    }
    
### Tentativa de se conectar a um nó dado seu ID

    const conn = await helia.libp2p.dial(multiaddr("/ip4/127.0.0.1/tcp/4001/p2p/${Id nó destino}"))
    // Retorna uma conexão com o nó de destino
    
    // A partir daqui não achei materiais na internet nem na documentação de como estabelecer uma conexão
    let stream = await conn.newStream('/ipfs/bitswap/1.0.0')
    // Aparentemente para se comunicar com o outro nó, é necessário criar uma stream passando um protocolo como parâmetro
    
    const data = new TextEncoder().encode('Hello, world!')
    try {
	    // await stream.sink.call(data, { signal: stream.close() })
	    let dados = await stream.source.return(data) // Aparentemente você deve adicionar dados ao stream e depois enviar
	    console.log(dados)
	    await stream.sink([dados.value])
    } catch (error) {
	    console.log(error)
    }
