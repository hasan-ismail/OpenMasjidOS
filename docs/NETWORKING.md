# Networking — static IP & `.local` access

OpenMasjidOS is reached on your local network at:

- **`http://openmasjidos.local:8723`** — the easiest, once mDNS (`avahi`) is set up.
- **`http://<server-ip>:8723`** — always works on the LAN.

## mDNS (`.local`)

The installer can set the machine's hostname to `openmasjidos` and enable
`avahi-daemon` so other devices on the network resolve `openmasjidos.local`.
On the phones/laptops connecting:

- macOS and iOS resolve `.local` out of the box (Bonjour).
- Windows 10/11 resolve `.local` via the built-in mDNS resolver.
- Most Linux desktops resolve `.local` if `avahi`/`nss-mdns` is installed.

If `.local` doesn't resolve on a device, use the raw IP address instead.

## Static IP (optional, guided, safe)

A server is easiest to reach if its IP doesn't change. The installer can offer
to pin the machine's **current** IP as static, but only with your explicit
confirmation, because:

- **Changing the IP on a remote box can drop your SSH session.** Reconnect on
  the new address if so.
- **On a cloud/VPS the provider manages addressing** — the installer skips this
  by default there, since changing it can lock you out.

### Doing it manually

Detect your network stack and edit the matching config:

- **netplan** (Ubuntu Server): `/etc/netplan/*.yaml`, then `sudo netplan apply`.
- **NetworkManager** (`nmcli`): `nmcli con mod <name> ipv4.addresses <cidr>
  ipv4.gateway <gw> ipv4.method manual && nmcli con up <name>`.
- **dhcpcd** (older Raspberry Pi OS): add a `static ip_address=` block to
  `/etc/dhcpcd.conf`.
- **systemd-networkd**: a `[Network]` `Address=`/`Gateway=` in
  `/etc/systemd/network/*.network`.

Always note your current IP, gateway, and interface first so you can revert.

## Ports

The dashboard listens on **8723**. To use a different external port, change the
left side of the port mapping in `/opt/openmasjid/docker-compose.yml`
(e.g. `"9000:8723"`) and re-run the installer's **Repair**.
