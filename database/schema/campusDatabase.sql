CREATE TABLE buildings (
    building_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    building_id INT NOT NULL,
    room_code VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    floor INT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_r_building
        FOREIGN KEY (building_id) REFERENCES buildings(building_id),
    CONSTRAINT uq_room UNIQUE (building_id, room_code)
);

CREATE TABLE room_features (
    feature_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE room_feature_map (
    room_id INT NOT NULL,
    feature_id INT NOT NULL,
    PRIMARY KEY (room_id, feature_id),
    CONSTRAINT fk_rfm_rooms
        FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    CONSTRAINT fk_rfm_features
        FOREIGN KEY (feature_id) REFERENCES room_features(feature_id)
);

CREATE TABLE graph_nodes (
    graph_node_id INT PRIMARY KEY,
    x FLOAT NOT NULL,
    y FLOAT NOT NULL,
    building_id INT NULL,
    floor INT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_gn_building
        FOREIGN KEY (building_id) REFERENCES buildings(building_id)
);

CREATE TABLE path_nodes (
    graph_node_id INT PRIMARY KEY,
    CONSTRAINT fk_pn_graph
        FOREIGN KEY (graph_node_id) REFERENCES graph_nodes(graph_node_id)
);

CREATE TABLE path_features (
    feature_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE path_feature_map (
    graph_node_id INT NOT NULL,
    feature_id INT NOT NULL,
    PRIMARY KEY (graph_node_id, feature_id),
    CONSTRAINT fk_pfm_path_nodes
        FOREIGN KEY (graph_node_id) REFERENCES path_nodes(graph_node_id),
    CONSTRAINT fk_pfm_features
        FOREIGN KEY (feature_id) REFERENCES path_features(feature_id)
);

CREATE TABLE room_nodes (
    graph_node_id INT PRIMARY KEY,
    room_id INT NOT NULL,
    CONSTRAINT fk_rn_graph
        FOREIGN KEY (graph_node_id) REFERENCES graph_nodes(graph_node_id),
    CONSTRAINT fk_rn_rooms
        FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);

CREATE TABLE edges (
    edge_id INT AUTO_INCREMENT PRIMARY KEY,
    from_node_id INT NOT NULL,
    to_node_id INT NOT NULL,
    distance FLOAT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_e_fromgraph
        FOREIGN KEY (from_node_id) REFERENCES graph_nodes(graph_node_id),
    CONSTRAINT fk_e_tograph
        FOREIGN KEY (to_node_id) REFERENCES graph_nodes(graph_node_id),
    CONSTRAINT chk_no_self_loop CHECK (from_node_id <> to_node_id),
    CONSTRAINT chk_positive_distance CHECK (distance > 0)
);

CREATE INDEX idx_edges_from_node ON edges(from_node_id);
CREATE INDEX idx_edges_to_node ON edges(to_node_id);
CREATE INDEX idx_rooms_building_floor ON rooms(building_id, floor);
CREATE INDEX idx_rooms_code ON rooms(room_code);
CREATE INDEX idx_graph_nodes_building_floor ON graph_nodes(building_id, floor);
CREATE INDEX idx_rfm_feature ON room_feature_map(feature_id);
CREATE INDEX idx_pfm_feature ON path_feature_map(feature_id);


