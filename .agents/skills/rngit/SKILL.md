---
name: rngit
description: "rngit and git-remote-rns facts, plus MeshChatX repository URLs on Reticulum. Use for /git page copy, clone commands, and mirror wording."
---

# rngit

`rngit` is Git repository hosting over Reticulum, shipped with RNS. Git talks to it through the `git-remote-rns` helper and `rns://` remotes.

Manual: https://reticulum.network/manual/git.html

URL form: `rns://DESTINATION_HASH/group/repo`

Example group/repo path: `public/MeshChatX` on a destination hash.

`rngit` can also expose a Nomad Network page node so NomadNet clients can browse repo metadata without a clearnet Git host.

## MeshChatX on rngit

Values in `config/meshchatx.php`:

| Field | Value |
| --- | --- |
| `rngit_rns` | `rns://06a54b505bb67b25ef3f8097e8001edc/public/MeshChatX` |
| `rngit_nomadnet` | see block below |

NomadNet page string:

```text
132f67e79d9b24aad014e93015fb858f:/page/repo.mu`g=public|r=MeshChatX
```

Clone command shown on the site:

```bash
git clone rns://06a54b505bb67b25ef3f8097e8001edc/public/MeshChatX
```

## How this site talks about it

- rngit is the canonical tree.
- GitHub and LavaForge are public mirrors for CI, releases, and people without Reticulum access.
- There is no clearnet HTTP endpoint for this MeshChatX rngit host. Do not add `git.quad4.io` or invent one.
- On `/git`, rngit actions are clone-over-RNS and NomadNet page open/copy. GitHub and LavaForge are open-repository links (and clearnet clone where configured).

## Do not

- Invent destination hashes or NomadNet paths. Read `config/meshchatx.php`.
- Describe rngit as "just another GitHub". It is Git over Reticulum, not a clearnet forge UI for this project.
