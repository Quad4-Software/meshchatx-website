---
name: reticulum
description: "Background on the Reticulum Network Stack for accurate MeshChatX and site copy. Use when explaining mesh networking, identities, LXMF, NomadNet, or crypto claims."
---

# Reticulum

Reticulum is a cryptography-based networking stack for local and wide-area networks. It is designed to work with high latency and low bandwidth, including radio and LoRa-style links as well as IP.

Reference implementation and protocol authority: https://github.com/markqvist/Reticulum

Manual: https://reticulum.network/manual/

Crypto overview used by this site: https://reticulum.network/crypto.html

Maintainer: Mark Qvist. GitHub `markqvist/Reticulum` is a public mirror. Development of Reticulum itself happens elsewhere on the mesh (see Reticulum docs on distributed development and rngit).

## Facts to keep straight

- Addresses are hashes of identities, not locations.
- Transport nodes forward blindly. They are not privileged operators of other people's traffic.
- End-to-end encryption and related properties come from the Reticulum stack. MeshChatX uses that stack. Do not rewrite crypto claims as MeshChatX inventions.
- LXMF is messaging over Reticulum. NomadNet is a page/browser style application surface over Reticulum.
- MeshChatX is a client application that speaks Reticulum. It is not the network itself.

## Related skills

- Design principles text: `.agents/skills/reticulum-zen/SKILL.md`
- Git over Reticulum: `.agents/skills/rngit/SKILL.md`
