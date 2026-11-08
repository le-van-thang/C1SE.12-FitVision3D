# -*- coding: utf-8 -*-
"""
===============================================================================
MODULE ĐO LƯỜNG CƠ THỂ 3D THEO CHUẨN ISO 8559 (SHAPY BODY MEASUREMENTS)
-------------------------------------------------------------------------------
[INDEX CÁC PHƯƠNG THỨC TRONG FILE]:
1. __init__(cfg)                        : Đọc file định nghĩa mốc giải phẫu (.yaml).
2. _intersect_horizontal_plane_pytorch(): Cắt lát mặt phẳng ngang Y = h + Lọc bỏ cánh tay T-pose.
3. _intersect_vertical_x_plane_pytorch(): Cắt lát mặt phẳng đứng X = x vuông góc trục tay T-pose.
4. _intersect_leg_horizontal_plane()    : Cắt lát mặt phẳng ngang Y = h tách riêng chân trái/phải.
5. compute_peripheries()                : Tính chu vi Ngực, Eo, Hông bằng ConvexHull 2D.
6. compute_limb_peripheries()           : Tính chu vi Bắp tay, Cổ tay, Đùi, Bắp chân, Cổ chân.
7. compute_height()                     : Đo khoảng cách trục Y từ Đỉnh đầu đến Gót chân trái.
8. compute_dynamic_density()            : Nội suy khối lượng riêng sinh học động theo BMI & Giới tính (Siri/Deurenberg).
9. compute_mass()                       : Tính thể tích lưới 3D x Khối lượng riêng sinh học động (neo chuẩn 985 kg/m3).
10. forward()                           : Trả về dict chứa đầy đủ số đo thân & tứ chi.
===============================================================================
"""

from typing import NewType, Dict, Tuple
import os.path as osp
import yaml
import numpy as np
import torch
import torch.nn as nn
from scipy.spatial import ConvexHull

Tensor = NewType('Tensor', torch.Tensor)


class BodyMeasurements(nn.Module):
    # Khối lượng riêng trung bình của cơ thể người: 985 kg/m^3
    DENSITY = 985

    def __init__(self, cfg, **kwargs):
        super(BodyMeasurements, self).__init__()

        meas_definition_path = osp.expanduser(osp.expandvars(cfg.get('meas_definition_path', '')))
        meas_vertices_path = osp.expanduser(osp.expandvars(cfg.get('meas_vertices_path', '')))

        with open(meas_definition_path, 'r') as f:
            measurements_definitions = yaml.safe_load(f)

        with open(meas_vertices_path, 'r') as f:
            meas_vertices = yaml.safe_load(f)

        head_top = meas_vertices['HeadTop']
        left_heel = meas_vertices['HeelLeft']

        self.left_heel_face_idx = left_heel['face_idx']
        self.register_buffer('left_heel_bc', torch.tensor(left_heel['bc'], dtype=torch.float32))

        self.head_top_face_idx = head_top['face_idx']
        self.register_buffer('head_top_bc', torch.tensor(head_top['bc'], dtype=torch.float32))

        chest_data = meas_vertices[measurements_definitions['CW_p'][0]]
        self.chest_face_index = chest_data['face_idx']
        self.register_buffer('chest_bcs', torch.tensor(chest_data['bc'], dtype=torch.float32))

        belly_data = meas_vertices[measurements_definitions['BW_p'][0]]
        self.belly_face_index = belly_data['face_idx']
        self.register_buffer('belly_bcs', torch.tensor(belly_data['bc'], dtype=torch.float32))

        hips_data = meas_vertices[measurements_definitions['IW_p'][0]]
        self.hips_face_index = hips_data['face_idx']
        self.register_buffer('hips_bcs', torch.tensor(hips_data['bc'], dtype=torch.float32))

        # Các mốc giải phẫu phục vụ đo chu vi tứ chi (Bắp tay, Cổ tay, Vòng đùi, Bắp chân, Cổ chân)
        crotch_data = meas_vertices['Crotch']
        self.crotch_face_idx = crotch_data['face_idx']
        self.register_buffer('crotch_bc', torch.tensor(crotch_data['bc'], dtype=torch.float32))

        sh_l = meas_vertices['ShoulderLeft']
        self.shoulder_l_face_idx = sh_l['face_idx']
        self.register_buffer('shoulder_l_bc', torch.tensor(sh_l['bc'], dtype=torch.float32))

        sh_r = meas_vertices['ShoulderRight']
        self.shoulder_r_face_idx = sh_r['face_idx']
        self.register_buffer('shoulder_r_bc', torch.tensor(sh_r['bc'], dtype=torch.float32))

        el_l = meas_vertices['ElbowLeft']
        self.elbow_l_face_idx = el_l['face_idx']
        self.register_buffer('elbow_l_bc', torch.tensor(el_l['bc'], dtype=torch.float32))

        el_r = meas_vertices['ElbowRight']
        self.elbow_r_face_idx = el_r['face_idx']
        self.register_buffer('elbow_r_bc', torch.tensor(el_r['bc'], dtype=torch.float32))

        wr_l = meas_vertices['WristLeft']
        self.wrist_l_face_idx = wr_l['face_idx']
        self.register_buffer('wrist_l_bc', torch.tensor(wr_l['bc'], dtype=torch.float32))

        wr_r = meas_vertices['WristRight']
        self.wrist_r_face_idx = wr_r['face_idx']
        self.register_buffer('wrist_r_bc', torch.tensor(wr_r['bc'], dtype=torch.float32))

    @staticmethod
    def _intersect_horizontal_plane_pytorch(triangles_single: Tensor, plane_y: float, filter_arms: bool = True) -> np.ndarray:
        """
        Tìm giao điểm giữa lưới tam giác 3D (Fx3x3) và mặt phẳng ngang Y = plane_y.
        Nếu filter_arms=True: Tự động loại bỏ các điểm thuộc 2 cánh tay/bàn tay đang dang ngang ở T-pose
        bằng cách phát hiện khoảng hở không khí (gap) giữa lồng ngực và cánh tay dọc theo trục X.
        """
        y = triangles_single[:, :, 1] - plane_y
        edges = [(0, 1), (1, 2), (2, 0)]
        intersect_pts = []

        for i0, i1 in edges:
            y0, y1 = y[:, i0], y[:, i1]
            mask = ((y0 <= 0) & (y1 >= 0)) | ((y0 >= 0) & (y1 <= 0))
            valid = mask & (torch.abs(y1 - y0) > 1e-8)
            if valid.any():
                t = (-y0[valid] / (y1[valid] - y0[valid])).unsqueeze(-1)
                v0 = triangles_single[valid, i0, :]
                v1 = triangles_single[valid, i1, :]
                pts = v0 + t * (v1 - v0)
                intersect_pts.append(pts)

        if len(intersect_pts) == 0:
            return np.zeros((0, 3), dtype=np.float32)

        pts_np = torch.cat(intersect_pts, dim=0).detach().cpu().numpy()

        if filter_arms and len(pts_np) > 10:
            # Lồng ngực luôn đối xứng quanh tâm X = 0.
            # Cánh tay giơ ngang ở T-pose chỉ xuất hiện khi có điểm vươn xa (|X| >= 0.28m).
            x_abs = np.abs(pts_np[:, 0])
            if np.max(x_abs) >= 0.28:
                sorted_x = np.sort(x_abs)
                diffs = np.diff(sorted_x)
                # Khoảng trống không khí thực tế giữa nách/thân người và bắp tay T-pose luôn >= 3.5cm (0.035m).
                # Chỉ quét tìm khoảng trống bắt đầu từ ngoài bán kính thân người tối thiểu (> 0.16m).
                gap_indices = np.where((sorted_x[:-1] > 0.16) & (diffs > 0.035))[0]
                if len(gap_indices) > 0:
                    cutoff_x = sorted_x[gap_indices[0]] + 0.01
                    pts_np = pts_np[x_abs <= cutoff_x]
                elif np.max(x_abs) > 0.40:
                    # Nếu cánh tay giơ ngang xa (> 0.40m) mà mesh nối liền nách, cắt ở biên sườn an toàn
                    pts_np = pts_np[x_abs <= 0.32]

        return pts_np

    @staticmethod
    def _intersect_vertical_x_plane_pytorch(
        triangles_single: Tensor,
        plane_x: float,
        ref_y: float,
        ref_z: float,
        radius_yz: float = 0.15
    ) -> np.ndarray:
        """
        Tìm giao điểm giữa lưới tam giác 3D (Fx3x3) và mặt phẳng đứng X = plane_x (vuông góc trục cánh tay ở T-pose).
        Chỉ giữ các điểm thuộc thiết diện cánh tay nằm trong bán kính radius_yz quanh tâm (ref_y, ref_z)
        để loại bỏ hoàn toàn thân mình/sườn.
        """
        x = triangles_single[:, :, 0] - plane_x
        edges = [(0, 1), (1, 2), (2, 0)]
        intersect_pts = []

        for i0, i1 in edges:
            x0, x1 = x[:, i0], x[:, i1]
            mask = ((x0 <= 0) & (x1 >= 0)) | ((x0 >= 0) & (x1 <= 0))
            valid = mask & (torch.abs(x1 - x0) > 1e-8)
            if valid.any():
                t = (-x0[valid] / (x1[valid] - x0[valid])).unsqueeze(-1)
                v0 = triangles_single[valid, i0, :]
                v1 = triangles_single[valid, i1, :]
                pts = v0 + t * (v1 - v0)
                intersect_pts.append(pts)

        if len(intersect_pts) == 0:
            return np.zeros((0, 3), dtype=np.float32)

        pts_np = torch.cat(intersect_pts, dim=0).detach().cpu().numpy()
        dist_yz = np.hypot(pts_np[:, 1] - ref_y, pts_np[:, 2] - ref_z)
        return pts_np[dist_yz <= radius_yz]

    @classmethod
    def _intersect_leg_horizontal_plane(
        cls,
        triangles_single: Tensor,
        plane_y: float,
        side: str = 'left'
    ) -> np.ndarray:
        """
        Cắt mặt phẳng ngang Y = plane_y qua chân và tách riêng chân trái (X > 0) hoặc chân phải (X < 0).
        """
        pts_np = cls._intersect_horizontal_plane_pytorch(triangles_single, plane_y, filter_arms=False)
        if len(pts_np) == 0:
            return pts_np
        if side == 'left':
            return pts_np[pts_np[:, 0] > 0.0]
        return pts_np[pts_np[:, 0] < 0.0]

    @staticmethod
    def _convex_hull_perimeter(
        pts_3d: np.ndarray,
        proj_axes: Tuple[int, int],
        device: torch.device,
        dtype: torch.dtype
    ) -> Tuple[Tensor, Tensor]:
        """Tính chu vi bao lồi 2D (ConvexHull) trên mặt phẳng chiếu proj_axes."""
        if len(pts_3d) < 3:
            zero_val = torch.tensor(0.0, device=device, dtype=dtype)
            empty_pts = torch.zeros((0, 2, 3), device=device, dtype=dtype)
            return zero_val, empty_pts

        points_in_plane = pts_3d[:, list(proj_axes)]
        hull = ConvexHull(points_in_plane)
        point_indices = hull.simplices.reshape(-1)

        pts_tensor = torch.tensor(pts_3d, device=device, dtype=dtype)
        hull_points = pts_tensor[point_indices].reshape(-1, 2, 3)
        meas_value = (hull_points[:, 1] - hull_points[:, 0]).pow(2).sum(dim=-1).sqrt().sum()
        return meas_value, hull_points

    def _get_landmark_batch(self, triangles: Tensor, face_idx: int, bc: Tensor) -> Tensor:
        """Nội suy tọa độ 3D (Bx3) của điểm mốc từ chỉ số mặt tam giác và trọng số barycentric."""
        return (triangles[:, face_idx] * bc.reshape(1, 3, 1)).sum(dim=1)

    def compute_peripheries(
        self,
        triangles: Tensor,
        compute_chest: bool = True,
        compute_waist: bool = True,
        compute_hips: bool = True,
    ) -> Dict[str, Tensor]:
        batch_size = triangles.shape[0]
        device = triangles.device

        meas_data = {}
        if compute_chest:
            # Chỉ lọc cánh tay ở vòng ngực (chest). Ở T-pose, eo và hông nằm sâu bên dưới, không bao giờ chạm tay.
            meas_data['chest'] = (self.chest_face_index, self.chest_bcs, True)
        if compute_waist:
            meas_data['waist'] = (self.belly_face_index, self.belly_bcs, False)
        if compute_hips:
            meas_data['hips'] = (self.hips_face_index, self.hips_bcs, False)

        output = {}
        for name, (face_index, bcs, should_filter_arms) in meas_data.items():
            vertex = (triangles[:, face_index] * bcs.reshape(1, 3, 1)).sum(axis=1)

            output[name] = {
                'points': [],
                'valid_points': [],
                'value': [],
                'plane_height': vertex[:, 1],
            }

            for ii in range(batch_size):
                plane_y = float(vertex[ii, 1].item())
                pts_3d = self._intersect_horizontal_plane_pytorch(
                    triangles[ii], plane_y, filter_arms=should_filter_arms
                )

                meas_value, hull_points = self._convex_hull_perimeter(
                    pts_3d, (0, 2), device, triangles.dtype
                )

                output[name]['valid_points'].append(pts_3d)
                output[name]['points'].append(hull_points)
                output[name]['value'].append(meas_value)

            output[name]['tensor'] = torch.stack(output[name]['value'])
        return output

    def compute_limb_peripheries(
        self,
        triangles: Tensor,
        compute_bicep: bool = True,
        compute_wrist: bool = True,
        compute_thigh: bool = True,
        compute_calf: bool = True,
        compute_ankle: bool = True,
    ) -> Dict[str, Dict]:
        """
        Đo chu vi tứ chi chuẩn ISO 8559-1 bằng thiết diện cắt ngang 3D (lấy trung bình cộng Trái & Phải):
        - bicep (Vòng bắp tay - ISO 8559-1 5.3.16): Mặt phẳng đứng X tại trung điểm (50%) giữa Đỉnh vai và Cùi chỏ.
        - wrist (Vòng cổ tay - ISO 8559-1 5.3.18): Mặt phẳng đứng X tại vị trí 92% từ Cùi chỏ đến Cổ tay (ngay trên mắt cá cổ tay).
        - thigh (Vòng đùi - ISO 8559-1 5.3.20)   : Mặt phẳng ngang Y dưới đáy quần (Crotch) một đoạn 6% chiều dài Inseam (~4.5 cm).
        - calf  (Vòng bắp chân - ISO 8559-1 5.3.22): Mặt phẳng ngang Y dưới đáy quần một đoạn 56% chiều dài Inseam (đỉnh cơ bụng chân).
        - ankle (Vòng cổ chân - ISO 8559-1 5.3.23): Mặt phẳng ngang Y dưới đáy quần một đoạn 84% chiều dài Inseam (thắt cổ chân trên mắt cá).
        """
        batch_size = triangles.shape[0]
        device = triangles.device
        dtype = triangles.dtype

        sh_l = self._get_landmark_batch(triangles, self.shoulder_l_face_idx, self.shoulder_l_bc)
        sh_r = self._get_landmark_batch(triangles, self.shoulder_r_face_idx, self.shoulder_r_bc)
        el_l = self._get_landmark_batch(triangles, self.elbow_l_face_idx, self.elbow_l_bc)
        el_r = self._get_landmark_batch(triangles, self.elbow_r_face_idx, self.elbow_r_bc)
        wr_l = self._get_landmark_batch(triangles, self.wrist_l_face_idx, self.wrist_l_bc)
        wr_r = self._get_landmark_batch(triangles, self.wrist_r_face_idx, self.wrist_r_bc)
        crotch = self._get_landmark_batch(triangles, self.crotch_face_idx, self.crotch_bc)
        heel_l = self._get_landmark_batch(triangles, self.left_heel_face_idx, self.left_heel_bc)

        active_keys = []
        if compute_bicep:
            active_keys.append('bicep')
        if compute_wrist:
            active_keys.append('wrist')
        if compute_thigh:
            active_keys.append('thigh')
        if compute_calf:
            active_keys.append('calf')
        if compute_ankle:
            active_keys.append('ankle')

        output = {
            k: {'points': [], 'valid_points': [], 'value': []}
            for k in active_keys
        }

        for ii in range(batch_size):
            tris_i = triangles[ii]

            # 1. Vòng bắp tay (Bicep girth): t = 0.50 giữa Shoulder và Elbow
            if compute_bicep:
                bicep_l_pt = 0.5 * (sh_l[ii] + el_l[ii])
                bicep_r_pt = 0.5 * (sh_r[ii] + el_r[ii])
                pts_bl = self._intersect_vertical_x_plane_pytorch(
                    tris_i, float(bicep_l_pt[0].item()), float(bicep_l_pt[1].item()), float(bicep_l_pt[2].item()), radius_yz=0.15
                )
                pts_br = self._intersect_vertical_x_plane_pytorch(
                    tris_i, float(bicep_r_pt[0].item()), float(bicep_r_pt[1].item()), float(bicep_r_pt[2].item()), radius_yz=0.15
                )
                val_bl, hull_bl = self._convex_hull_perimeter(pts_bl, (1, 2), device, dtype)
                val_br, _ = self._convex_hull_perimeter(pts_br, (1, 2), device, dtype)
                val_bicep = 0.5 * (val_bl + val_br) if (val_bl > 0 and val_br > 0) else torch.max(val_bl, val_br)
                output['bicep']['valid_points'].append(pts_bl)
                output['bicep']['points'].append(hull_bl)
                output['bicep']['value'].append(val_bicep)

            # 2. Vòng cổ tay (Wrist girth): t = 0.92 từ Elbow đến Wrist (ngay trên mỏm trâm cổ tay)
            if compute_wrist:
                wrist_l_pt = el_l[ii] + 0.92 * (wr_l[ii] - el_l[ii])
                wrist_r_pt = el_r[ii] + 0.92 * (wr_r[ii] - el_r[ii])
                pts_wl = self._intersect_vertical_x_plane_pytorch(
                    tris_i, float(wrist_l_pt[0].item()), float(wrist_l_pt[1].item()), float(wrist_l_pt[2].item()), radius_yz=0.10
                )
                pts_wr = self._intersect_vertical_x_plane_pytorch(
                    tris_i, float(wrist_r_pt[0].item()), float(wrist_r_pt[1].item()), float(wrist_r_pt[2].item()), radius_yz=0.10
                )
                val_wl, hull_wl = self._convex_hull_perimeter(pts_wl, (1, 2), device, dtype)
                val_wr, _ = self._convex_hull_perimeter(pts_wr, (1, 2), device, dtype)
                val_wrist = 0.5 * (val_wl + val_wr) if (val_wl > 0 and val_wr > 0) else torch.max(val_wl, val_wr)
                output['wrist']['valid_points'].append(pts_wl)
                output['wrist']['points'].append(hull_wl)
                output['wrist']['value'].append(val_wrist)

            # Chiều dài chân trong (Inseam) làm hệ quy chiếu tỉ lệ giải phẫu dọc theo chân
            crotch_y = float(crotch[ii, 1].item())
            heel_y = float(heel_l[ii, 1].item())
            inseam_len = abs(crotch_y - heel_y)

            # 3. Vòng đùi (Thigh girth): 6% Inseam dưới điểm đáy quần Crotch (~4.5 cm)
            if compute_thigh:
                thigh_y = crotch_y - 0.06 * inseam_len
                pts_tl = self._intersect_leg_horizontal_plane(tris_i, thigh_y, side='left')
                pts_tr = self._intersect_leg_horizontal_plane(tris_i, thigh_y, side='right')
                val_tl, hull_tl = self._convex_hull_perimeter(pts_tl, (0, 2), device, dtype)
                val_tr, _ = self._convex_hull_perimeter(pts_tr, (0, 2), device, dtype)
                val_thigh = 0.5 * (val_tl + val_tr) if (val_tl > 0 and val_tr > 0) else torch.max(val_tl, val_tr)
                output['thigh']['valid_points'].append(pts_tl)
                output['thigh']['points'].append(hull_tl)
                output['thigh']['value'].append(val_thigh)

            # 4. Vòng bắp chân (Calf girth): 56% Inseam dưới điểm Crotch (chỗ nở nhất của cơ bụng chân)
            if compute_calf:
                calf_y = crotch_y - 0.56 * inseam_len
                pts_cl = self._intersect_leg_horizontal_plane(tris_i, calf_y, side='left')
                pts_cr = self._intersect_leg_horizontal_plane(tris_i, calf_y, side='right')
                val_cl, hull_cl = self._convex_hull_perimeter(pts_cl, (0, 2), device, dtype)
                val_cr, _ = self._convex_hull_perimeter(pts_cr, (0, 2), device, dtype)
                val_calf = 0.5 * (val_cl + val_cr) if (val_cl > 0 and val_cr > 0) else torch.max(val_cl, val_cr)
                output['calf']['valid_points'].append(pts_cl)
                output['calf']['points'].append(hull_cl)
                output['calf']['value'].append(val_calf)

            # 5. Vòng cổ chân (Ankle girth): 84% Inseam dưới điểm Crotch (chỗ thắt nhỏ nhất ngay trên mắt cá chân)
            if compute_ankle:
                ankle_y = crotch_y - 0.84 * inseam_len
                pts_al = self._intersect_leg_horizontal_plane(tris_i, ankle_y, side='left')
                pts_ar = self._intersect_leg_horizontal_plane(tris_i, ankle_y, side='right')
                val_al, hull_al = self._convex_hull_perimeter(pts_al, (0, 2), device, dtype)
                val_ar, _ = self._convex_hull_perimeter(pts_ar, (0, 2), device, dtype)
                val_ankle = 0.5 * (val_al + val_ar) if (val_al > 0 and val_ar > 0) else torch.max(val_al, val_ar)
                output['ankle']['valid_points'].append(pts_al)
                output['ankle']['points'].append(hull_al)
                output['ankle']['value'].append(val_ankle)

        for k in active_keys:
            output[k]['tensor'] = torch.stack(output[k]['value'])

        return output

    def compute_height(self, shaped_triangles: Tensor) -> Tuple[Tensor, Tensor]:
        """
        Đo chiều cao toàn thân (Stature - ISO 8559-1 5.1.1):
        Tính khoảng cách dọc trục đứng Y từ đỉnh đầu (HeadTop) đến gót chân trái (HeelLeft)
        thông qua nội suy trọng tâm tam giác (Barycentric Coordinates).
        """
        head_top_tri = shaped_triangles[:, self.head_top_face_idx]
        head_top = (head_top_tri * self.head_top_bc.reshape(1, 3, 1)).sum(dim=1)

        left_heel_tri = shaped_triangles[:, self.left_heel_face_idx]
        left_heel = (left_heel_tri * self.left_heel_bc.reshape(1, 3, 1)).sum(dim=1)

        return (
            torch.abs(head_top[:, 1] - left_heel[:, 1]),
            torch.stack([head_top, left_heel], axis=0)
        )

    @classmethod
    def compute_dynamic_density(
        cls,
        height_m: float = None,
        weight_kg: float = None,
        gender: str = 'neutral'
    ) -> float:
        """
        Tính khối lượng riêng cơ thể sinh học động (kg/m^3) theo phương trình Siri & Deurenberg
        dựa trên chỉ số BMI và giới tính, lấy điểm neo chuẩn 985.0 kg/m^3 tại BMI tham chiếu 22.0.
        Đảm bảo mô hình thích ứng chính xác với tỷ lệ Mô mỡ (900 kg/m^3) và Cơ xương (1100 kg/m^3).
        """
        if height_m is None or weight_kg is None or height_m <= 0 or weight_kg <= 0:
            return float(cls.DENSITY)

        bmi = float(weight_kg) / (float(height_m) ** 2)
        bmi = max(13.0, min(45.0, bmi))

        g_str = str(gender).lower().strip()
        if g_str in ['male', 'nam', 'm']:
            sex_flag = 1.0
        elif g_str in ['female', 'nu', 'nữ', 'f']:
            sex_flag = 0.0
        else:
            sex_flag = 0.5

        # Phương trình Deurenberg ước tính tỷ lệ mỡ cơ thể (Body Fat %) ở độ tuổi trưởng thành tham chiếu (28 tuổi)
        # Tại BMI = 22.0, sex_flag = 0.5 -> BF%_ref = 22.04% -> mẫu số Siri_ref = 472.04
        body_fat_pct = (1.20 * bmi) + (0.23 * 28.0) - (10.8 * sex_flag) - 5.4
        body_fat_pct = max(5.0, min(50.0, body_fat_pct))

        # Quy đổi theo phương trình Siri được chuẩn hóa tại điểm neo DENSITY = 985.0 kg/m^3 của lưới SMPL-X
        dynamic_density = float(cls.DENSITY) * (472.04 / (body_fat_pct + 450.0))
        return float(np.clip(dynamic_density, 945.0, 1030.0))

    def compute_mass(self, tris: Tensor, custom_density: float = None) -> Tensor:
        """
        Tính khối lượng cơ thể 3D (Body Mass) bằng Định lý Phân kỳ (Divergence Theorem):
        Tổng thể tích đại số của 20.908 tứ diện có hướng tạo bởi gốc tọa độ O(0,0,0) và mỗi mặt tam giác:
            V = (1/6) * | sum_{f=1..F} det([v0, v1, v2]) |  (m^3)
            Mass = V * active_density                       (kg)
        Hàm khả vi hoàn toàn (Differentiable) phục vụ lan truyền ngược (Backpropagation) khi tối ưu betas.
        """
        x = tris[:, :, :, 0]
        y = tris[:, :, :, 1]
        z = tris[:, :, :, 2]
        volume = (
            -x[:, :, 2] * y[:, :, 1] * z[:, :, 0] +
            x[:, :, 1] * y[:, :, 2] * z[:, :, 0] +
            x[:, :, 2] * y[:, :, 0] * z[:, :, 1] -
            x[:, :, 0] * y[:, :, 2] * z[:, :, 1] -
            x[:, :, 1] * y[:, :, 0] * z[:, :, 2] +
            x[:, :, 0] * y[:, :, 1] * z[:, :, 2]
        ).sum(dim=1).abs() / 6.0
        active_density = float(custom_density) if (custom_density is not None and custom_density > 0) else float(self.DENSITY)
        return volume * active_density

    def forward(
        self,
        triangles: Tensor,
        compute_mass: bool = True,
        compute_height: bool = True,
        compute_chest: bool = True,
        compute_waist: bool = True,
        compute_hips: bool = True,
        compute_bicep: bool = True,
        compute_wrist: bool = True,
        compute_thigh: bool = True,
        compute_calf: bool = True,
        compute_ankle: bool = True,
        custom_density: float = None,
        **kwargs
    ):
        measurements = {}
        if compute_mass:
            measurements['mass'] = {'tensor': self.compute_mass(triangles, custom_density=custom_density)}

        if compute_height:
            mesh_height, points = self.compute_height(triangles)
            measurements['height'] = {'tensor': mesh_height, 'points': points}

        output = self.compute_peripheries(
            triangles,
            compute_chest=compute_chest,
            compute_waist=compute_waist,
            compute_hips=compute_hips,
        )
        measurements.update(output)

        limb_output = self.compute_limb_peripheries(
            triangles,
            compute_bicep=compute_bicep,
            compute_wrist=compute_wrist,
            compute_thigh=compute_thigh,
            compute_calf=compute_calf,
            compute_ankle=compute_ankle,
        )
        measurements.update(limb_output)
        return {'measurements': measurements}
