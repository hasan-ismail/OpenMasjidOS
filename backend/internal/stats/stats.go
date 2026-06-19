// Package stats reports live host resource usage (CPU, memory, disk, network,
// uptime) for the dashboard home. Metrics reflect the HOST, not the container:
// the compose file mounts the host's /proc and /sys read-only and sets
// HOST_PROC / HOST_SYS, which gopsutil honours automatically.
package stats

import (
	"sync"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
)

// Snapshot is a point-in-time view of host resource usage. Network counters are
// cumulative byte totals; the client derives rates from successive snapshots.
type Snapshot struct {
	CPUPercent float64 `json:"cpu_percent"`
	MemUsed    uint64  `json:"mem_used"`
	MemTotal   uint64  `json:"mem_total"`
	DiskUsed   uint64  `json:"disk_used"`
	DiskTotal  uint64  `json:"disk_total"`
	UptimeSec  uint64  `json:"uptime_sec"`
	NetRxBytes uint64  `json:"net_rx_bytes"`
	NetTxBytes uint64  `json:"net_tx_bytes"`
}

// Collector samples CPU usage continuously in the background (so each request
// gets a stable percentage without blocking) and reads the other metrics
// on demand. Safe for concurrent use.
type Collector struct {
	mu       sync.RWMutex
	cpuPct   float64
	diskPath string
}

// NewCollector starts the background CPU sampler. diskPath is the filesystem
// whose usage is reported (the data directory — i.e. the host partition where
// app data lives).
func NewCollector(diskPath string) *Collector {
	c := &Collector{diskPath: diskPath}
	go c.sampleLoop()
	return c
}

// sampleLoop blocks for a 2s window each iteration, so cpu.Percent returns the
// average utilisation over that window — a smooth, stable reading.
func (c *Collector) sampleLoop() {
	for {
		pcts, err := cpu.Percent(2*time.Second, false)
		if err == nil && len(pcts) > 0 {
			c.mu.Lock()
			c.cpuPct = pcts[0]
			c.mu.Unlock()
		} else {
			time.Sleep(2 * time.Second)
		}
	}
}

// Snapshot reads the current host metrics. Any metric that can't be read is
// left at its zero value rather than failing the whole snapshot.
func (c *Collector) Snapshot() Snapshot {
	c.mu.RLock()
	cpuPct := c.cpuPct
	c.mu.RUnlock()

	s := Snapshot{CPUPercent: cpuPct}

	if vm, err := mem.VirtualMemory(); err == nil {
		s.MemUsed = vm.Used
		s.MemTotal = vm.Total
	}
	if du, err := disk.Usage(c.diskPath); err == nil {
		s.DiskUsed = du.Used
		s.DiskTotal = du.Total
	}
	if up, err := host.Uptime(); err == nil {
		s.UptimeSec = up
	}
	// Aggregate counters across all interfaces (false = not per-interface).
	if io, err := net.IOCounters(false); err == nil && len(io) > 0 {
		s.NetRxBytes = io[0].BytesRecv
		s.NetTxBytes = io[0].BytesSent
	}

	return s
}
