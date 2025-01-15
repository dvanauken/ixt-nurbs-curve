# Create test directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "test"

# Create main class test files
@(
    "Skeleton",
    "EventQueue",
    "Wavefront",
    "Polygon",
    "Edge",
    "Vertex",
    "Vector"
) | ForEach-Object {
    New-Item -ItemType File -Force -Path "test/$_.test.ts"
}

# Create events directory and test files
New-Item -ItemType Directory -Force -Path "test/events"
@(
    "Event",
    "EdgeEvent",
    "VertexEvent",
    "SplitEvent",
    "CollapseEvent"
) | ForEach-Object {
    New-Item -ItemType File -Force -Path "test/events/$_.test.ts"
}