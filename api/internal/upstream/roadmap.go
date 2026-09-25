package upstream

import (
	"context"
	"regexp"
	"strconv"
	"strings"
)

type RoadmapItem struct {
	Version  string   `json:"version"`
	Date     string   `json:"date"`
	Title    string   `json:"title"`
	Desc     string   `json:"desc"`
	Features []string `json:"features"`
	Status   string   `json:"status"`
}

// Roadmap loads the milestone list from the repo JSON file.
func (c *Client) Roadmap(ctx context.Context, rawURL string) ([]RoadmapItem, error) {
	var items []RoadmapItem
	if err := c.getJSON(ctx, rawURL, &items); err != nil {
		return nil, err
	}
	return items, nil
}

var semverPart = regexp.MustCompile(`^\d+$`)

// VerCmp compares dotted numeric versions a and b.
func VerCmp(a, b string) int {
	as, bs := strings.Split(a, "."), strings.Split(b, ".")
	for i := 0; i < len(as); i++ {
		av, _ := strconv.Atoi(as[i])
		bv := 0
		if i < len(bs) && semverPart.MatchString(bs[i]) {
			bv, _ = strconv.Atoi(bs[i])
		}
		if av != bv {
			return av - bv
		}
	}
	if len(bs) > len(as) {
		return -1
	}
	return 0
}

// ResolveRoadmap marks a milestone done when its version shipped and flags the
// first still-planned milestone as upcoming, mirroring the site logic.
func ResolveRoadmap(items []RoadmapItem, published []string) []RoadmapItem {
	pub := make(map[string]bool, len(published))
	for _, v := range published {
		pub[v] = true
	}
	out := make([]RoadmapItem, len(items))
	markedUpcoming := false
	for i, m := range items {
		out[i] = m
		if m.Status != "planned" {
			continue
		}
		shipped := false
		for v := range pub {
			if VerCmp(v, m.Version) >= 0 {
				shipped = true
				break
			}
		}
		if shipped {
			out[i].Status = "done"
		} else if !markedUpcoming {
			out[i].Status = "upcoming"
			markedUpcoming = true
		}
	}
	return out
}

// PublishedVersions returns the sorted list of shipped semver versions.
func PublishedVersions(rels []Release) []string {
	seen := map[string]bool{}
	var out []string
	for _, r := range rels {
		if seen[r.Version] {
			continue
		}
		seen[r.Version] = true
		out = append(out, r.Version)
	}
	return out
}
