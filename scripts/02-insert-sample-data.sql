-- Sample data for Train Traffic Controller System
-- This script populates the database with realistic Indian Railway data

-- Insert sample stations (major stations in Delhi-Mumbai route)
INSERT INTO stations (id, name, code, latitude, longitude, platforms) VALUES
('STN001', 'New Delhi Railway Station', 'NDLS', 28.6431, 77.2197, 16),
('STN002', 'Hazrat Nizamuddin', 'NZM', 28.5833, 77.2500, 7),
('STN003', 'Mathura Junction', 'MTJ', 27.4924, 77.6737, 6),
('STN004', 'Agra Cantt', 'AGC', 27.1592, 77.9784, 6),
('STN005', 'Gwalior Junction', 'GWL', 26.2124, 78.1772, 5),
('STN006', 'Jhansi Junction', 'JHS', 25.4484, 78.5685, 6),
('STN007', 'Bhopal Junction', 'BPL', 23.2599, 77.4126, 6),
('STN008', 'Itarsi Junction', 'ET', 22.6173, 77.7640, 5),
('STN009', 'Nagpur Junction', 'NGP', 21.1458, 79.0882, 6),
('STN010', 'Bhusaval Junction', 'BSL', 21.0444, 75.7849, 7),
('STN011', 'Manmad Junction', 'MMR', 20.2551, 74.4399, 4),
('STN012', 'Nashik Road', 'NK', 19.9975, 73.7898, 3),
('STN013', 'Kalyan Junction', 'KYN', 19.2403, 73.1305, 8),
('STN014', 'Thane', 'TNA', 19.1972, 72.9568, 8),
('STN015', 'Mumbai Central', 'BCT', 18.9690, 72.8205, 9);

-- Insert tracks connecting stations
INSERT INTO tracks (id, name, from_station_id, to_station_id, length_km, max_speed_kmh, status) VALUES
('TRK001', 'NDLS-NZM', 'STN001', 'STN002', 8.5, 80, 'operational'),
('TRK002', 'NZM-MTJ', 'STN002', 'STN003', 145.2, 130, 'operational'),
('TRK003', 'MTJ-AGC', 'STN003', 'STN004', 58.7, 110, 'operational'),
('TRK004', 'AGC-GWL', 'STN004', 'STN005', 118.3, 130, 'operational'),
('TRK005', 'GWL-JHS', 'STN005', 'STN006', 103.8, 130, 'operational'),
('TRK006', 'JHS-BPL', 'STN006', 'STN007', 231.4, 130, 'operational'),
('TRK007', 'BPL-ET', 'STN007', 'STN008', 59.2, 110, 'operational'),
('TRK008', 'ET-NGP', 'STN008', 'STN009', 310.5, 130, 'operational'),
('TRK009', 'NGP-BSL', 'STN009', 'STN010', 283.7, 130, 'operational'),
('TRK010', 'BSL-MMR', 'STN010', 'STN011', 181.2, 130, 'operational'),
('TRK011', 'MMR-NK', 'STN011', 'STN012', 36.8, 100, 'operational'),
('TRK012', 'NK-KYN', 'STN012', 'STN013', 68.4, 100, 'operational'),
('TRK013', 'KYN-TNA', 'STN013', 'STN014', 12.3, 80, 'operational'),
('TRK014', 'TNA-BCT', 'STN014', 'STN015', 34.2, 80, 'operational');

-- Insert signals for major stations
INSERT INTO signals (id, station_id, name, signal_type, status, latitude, longitude) VALUES
('SIG001', 'STN001', 'NDLS Entry Signal A', 'entry', 'green', 28.6425, 77.2190),
('SIG002', 'STN001', 'NDLS Exit Signal B', 'exit', 'green', 28.6437, 77.2204),
('SIG003', 'STN002', 'NZM Entry Signal A', 'entry', 'yellow', 28.5827, 77.2494),
('SIG004', 'STN002', 'NZM Exit Signal B', 'exit', 'green', 28.5839, 77.2506),
('SIG005', 'STN003', 'MTJ Entry Signal A', 'entry', 'green', 27.4918, 77.6731),
('SIG006', 'STN003', 'MTJ Exit Signal B', 'exit', 'red', 27.4930, 77.6743),
('SIG007', 'STN007', 'BPL Entry Signal A', 'entry', 'green', 23.2593, 77.4120),
('SIG008', 'STN007', 'BPL Exit Signal B', 'exit', 'yellow', 23.2605, 77.4132),
('SIG009', 'STN015', 'BCT Entry Signal A', 'entry', 'green', 18.9684, 72.8199),
('SIG010', 'STN015', 'BCT Exit Signal B', 'exit', 'green', 18.9696, 72.8211);

-- Insert sample trains with realistic Indian Railway numbers
INSERT INTO trains (id, train_number, name, train_type, priority, current_station_id, next_station_id, status, delay_minutes, current_speed_kmh, current_latitude, current_longitude) VALUES
('TRN001', '12951', 'Mumbai Rajdhani Express', 'express', 1, 'STN001', 'STN002', 'on_time', 0, 85, 28.6431, 77.2197),
('TRN002', '12952', 'New Delhi Rajdhani Express', 'express', 1, 'STN015', 'STN014', 'delayed', 15, 0, 18.9690, 72.8205),
('TRN003', '12615', 'Grand Trunk Express', 'express', 3, 'STN007', 'STN008', 'on_time', 0, 95, 23.2599, 77.4126),
('TRN004', '12616', 'Grand Trunk Express', 'express', 3, 'STN009', 'STN008', 'delayed', 8, 110, 21.1458, 79.0882),
('TRN005', '19019', 'Dehradun Express', 'express', 4, 'STN003', 'STN004', 'on_time', 0, 105, 27.4924, 77.6737),
('TRN006', '12137', 'Punjab Mail', 'express', 2, 'STN011', 'STN012', 'delayed', 22, 0, 20.2551, 74.4399),
('TRN007', '50001', 'Freight Special', 'freight', 8, 'STN005', 'STN006', 'on_time', 0, 65, 26.2124, 78.1772),
('TRN008', '12009', 'Shatabdi Express', 'express', 2, 'STN013', 'STN014', 'on_time', 0, 120, 19.2403, 73.1305),
('TRN009', '11077', 'Jhelum Express', 'express', 4, 'STN006', 'STN007', 'delayed', 5, 0, 25.4484, 78.5685),
('TRN010', '12715', 'Sachkhand Express', 'express', 3, 'STN010', 'STN011', 'on_time', 0, 115, 21.0444, 75.7849);

-- Insert train schedules
INSERT INTO train_schedules (train_id, station_id, scheduled_arrival, scheduled_departure, platform_number, sequence_order, delay_minutes) VALUES
-- Mumbai Rajdhani Express (12951) - NDLS to BCT
('TRN001', 'STN001', NULL, '16:55', 1, 1, 0),
('TRN001', 'STN002', '17:10', '17:12', 3, 2, 0),
('TRN001', 'STN003', '19:25', '19:27', 2, 3, 0),
('TRN001', 'STN007', '01:15', '01:25', 1, 4, 0),
('TRN001', 'STN015', '14:25', NULL, 5, 5, 0),

-- New Delhi Rajdhani Express (12952) - BCT to NDLS
('TRN002', 'STN015', NULL, '16:40', 6, 1, 15),
('TRN002', 'STN007', '05:00', '05:10', 2, 2, 15),
('TRN002', 'STN003', '12:48', '12:50', 1, 3, 15),
('TRN002', 'STN002', '15:03', '15:05', 4, 4, 15),
('TRN002', 'STN001', '15:20', NULL, 2, 5, 15),

-- Grand Trunk Express (12615)
('TRN003', 'STN007', NULL, '22:15', 3, 1, 0),
('TRN003', 'STN008', '23:05', '23:10', 2, 2, 0),
('TRN003', 'STN009', '05:15', '05:25', 1, 3, 0),

-- Freight Special (50001)
('TRN007', 'STN005', NULL, '14:30', 4, 1, 0),
('TRN007', 'STN006', '17:45', '18:00', 3, 2, 0),
('TRN007', 'STN007', '22:30', '23:00', 4, 3, 0);

-- Insert active conflicts
INSERT INTO conflicts (id, conflict_type, location_id, severity, estimated_delay_minutes, status) VALUES
('CNF001', 'platform', 'STN003', 'medium', 12, 'active'),
('CNF002', 'signal', 'SIG006', 'high', 25, 'active'),
('CNF003', 'crossing', 'STN011', 'low', 5, 'active'),
('CNF004', 'track', 'TRK008', 'critical', 45, 'resolved');

-- Link trains to conflicts
INSERT INTO conflict_trains (conflict_id, train_id) VALUES
('CNF001', 'TRN005'),
('CNF001', 'TRN003'),
('CNF002', 'TRN005'),
('CNF003', 'TRN006'),
('CNF003', 'TRN010');

-- Insert AI recommendations
INSERT INTO ai_recommendations (id, conflict_id, recommendation_type, target_train_id, action_description, reasoning, confidence_score, estimated_delay_reduction, status) VALUES
('REC001', 'CNF001', 'hold', 'TRN005', 'Hold Dehradun Express at MTJ for 8 minutes', 'Platform conflict with Grand Trunk Express. Holding lower priority train reduces overall delay.', 0.87, 7, 'pending'),
('REC002', 'CNF002', 'reroute', 'TRN005', 'Reroute via alternate track through platform 4', 'Signal failure on main line. Alternate route available with minimal delay.', 0.92, 18, 'accepted'),
('REC003', 'CNF003', 'priority_change', 'TRN006', 'Increase priority of Punjab Mail temporarily', 'Multiple trains at crossing. Prioritizing express service reduces passenger impact.', 0.78, 3, 'implemented'),
('REC004', 'CNF001', 'proceed', 'TRN003', 'Allow Grand Trunk Express to proceed on schedule', 'Higher priority train should maintain schedule. Platform will be clear in time.', 0.85, 5, 'pending');

-- Insert KPI snapshots for the last 24 hours
INSERT INTO kpi_snapshots (snapshot_time, punctuality_percentage, average_delay_minutes, trains_per_hour, conflicts_resolved, ai_acceptance_rate, section_id) VALUES
(NOW() - INTERVAL '1 hour', 78.5, 12.3, 8.2, 3, 85.7, 'SEC001'),
(NOW() - INTERVAL '2 hours', 82.1, 9.8, 7.9, 2, 90.0, 'SEC001'),
(NOW() - INTERVAL '3 hours', 75.3, 15.2, 8.5, 4, 75.0, 'SEC001'),
(NOW() - INTERVAL '4 hours', 88.9, 6.7, 9.1, 1, 100.0, 'SEC001'),
(NOW() - INTERVAL '6 hours', 71.2, 18.4, 7.3, 5, 80.0, 'SEC001'),
(NOW() - INTERVAL '8 hours', 85.6, 8.9, 8.8, 2, 85.7, 'SEC001'),
(NOW() - INTERVAL '12 hours', 79.4, 11.6, 8.0, 3, 88.9, 'SEC001'),
(NOW() - INTERVAL '18 hours', 83.7, 10.1, 8.4, 2, 92.3, 'SEC001'),
(NOW() - INTERVAL '24 hours', 77.8, 13.5, 7.8, 4, 83.3, 'SEC001');

-- Insert simulation scenarios
INSERT INTO simulation_scenarios (id, name, description, initial_state, expected_outcome) VALUES
('SIM001', 'Signal Failure at Major Junction', 'Simulates signal failure at Bhopal Junction during peak hours', 
 '{"failed_signals": ["SIG007"], "affected_trains": ["TRN003", "TRN009"], "duration_minutes": 45}',
 '{"expected_delay": 35, "trains_affected": 6, "alternate_routes": 2}'),
 
('SIM002', 'Track Blockage Emergency', 'Emergency track blockage between Nagpur and Bhusaval', 
 '{"blocked_tracks": ["TRK009"], "emergency_type": "landslide", "duration_hours": 3}',
 '{"expected_delay": 120, "trains_rerouted": 8, "passenger_impact": "high"}'),
 
('SIM003', 'Peak Hour Rush Management', 'Managing multiple express trains during evening rush hour', 
 '{"peak_time": "18:00-20:00", "train_density": "high", "platform_constraints": true}',
 '{"throughput_target": 12, "delay_target": 8, "efficiency_score": 85}'),
 
('SIM004', 'Freight Priority Conflict', 'Freight train blocking passenger express during schedule conflict', 
 '{"freight_trains": ["TRN007"], "express_trains": ["TRN001", "TRN008"], "priority_conflict": true}',
 '{"resolution_time": 15, "passenger_delay": 10, "freight_delay": 25}');
