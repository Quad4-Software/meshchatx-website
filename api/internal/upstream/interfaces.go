package upstream

import (
	"context"
	"encoding/json"
	"sort"
	"strings"
	"time"
)

// RnsInterface is a normalized row from directory.rns.recipes.
type RnsInterface struct {
	ID       any    `json:"id"`
	Name     string `json:"name"`
	Host     string `json:"host"`
	Port     any    `json:"port"`
	Type     string `json:"type"`
	TypeName string `json:"typeName"`
	Network  string `json:"network"`
	Status   string `json:"status"`
	Config   string `json:"config"`
}

type IfxPayload struct {
	Items     []RnsInterface `json:"items"`
	FetchedAt string         `json:"fetchedAt"`
	Stale     bool           `json:"stale"`
	Count     int            `json:"count"`
}

func (c *Client) Interfaces(ctx context.Context, directoryURL string) (*IfxPayload, error) {
	var body json.RawMessage
	if err := c.getJSON(ctx, directoryURL, &body); err != nil {
		return nil, err
	}
	var raw []map[string]any
	// the endpoint wraps rows in {"data": [...]} but tolerate a bare array too
	if err := json.Unmarshal(body, &raw); err != nil {
		var wrapped struct {
			Data []map[string]any `json:"data"`
		}
		if err2 := json.Unmarshal(body, &wrapped); err2 != nil {
			return nil, err2
		}
		raw = wrapped.Data
	}
	items := make([]RnsInterface, 0, len(raw))
	for _, row := range raw {
		it, ok := normalizeIface(row)
		if !ok {
			continue
		}
		items = append(items, it)
	}
	sort.Slice(items, func(i, j int) bool { return strings.ToLower(items[i].Name) < strings.ToLower(items[j].Name) })
	return &IfxPayload{
		Items:     items,
		FetchedAt: time.Now().UTC().Format(time.RFC3339),
		Stale:     false,
		Count:     len(items),
	}, nil
}

func strOf(v any) string {
	if s, ok := v.(string); ok {
		return strings.TrimSpace(s)
	}
	return ""
}

func normalizeIface(row map[string]any) (RnsInterface, bool) {
	name := strOf(row["name"])
	host := strOf(row["host"])
	if name == "" || host == "" {
		return RnsInterface{}, false
	}
	return RnsInterface{
		ID:       row["id"],
		Name:     name,
		Host:     host,
		Port:     row["port"],
		Type:     strOf(row["type"]),
		TypeName: strOf(row["typeName"]),
		Network:  strOf(row["network"]),
		Status:   strOf(row["status"]),
		Config:   strOf(row["config"]),
	}, true
}
