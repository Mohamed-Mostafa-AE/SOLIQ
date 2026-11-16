"""Generate original, redistribution-safe Egyptian Delta human GLBs with skinning.

Run: blender -b --python tools/build-original-delta-characters.py
No third-party assets, scans, likenesses, external textures, fonts or motion packs.
Blender 4.3 uses NLA tracks to export Idle/Walk/Run/Talk/Interact clips.
"""

from pathlib import Path
import bpy
import math
from mathutils import Vector

DEST = Path(__file__).resolve().parents[1] / "game" / "assets" / "models"
DEST.mkdir(parents=True, exist_ok=True)

PALETTES = {
    "nada": dict(skin=(0.47, .285, .20), skin_light=(.63, .39, .27),
                 hair=(.045, .032, .028), cloth=(.13, .35, .31),
                 cloth_dark=(.085, .20, .205), accent=(.90, .49, .25),
                 pants=(.225, .225, .19), scarf=(.90, .47, .24)),
    "hassan": dict(skin=(.40, .245, .17), skin_light=(.57, .36, .265),
                   hair=(.54, .54, .50), cloth=(.62, .70, .74),
                   cloth_dark=(.38, .49, .55), accent=(.78, .63, .42),
                   pants=(.39, .43, .43), scarf=(.93, .91, .83)),
    "maryam": dict(skin=(.45, .285, .205), skin_light=(.61, .397, .29),
                   hair=(.048, .033, .03), cloth=(.17, .22, .41),
                   cloth_dark=(.10, .13, .245), accent=(.93, .71, .43),
                   pants=(.15, .20, .38), scarf=(.70, .25, .245)),
}


def mat(name, color, roughness=.8, metallic=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    return m


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def create_armature(name):
    data = bpy.data.armatures.new(name + ' Armature')
    rig = bpy.data.objects.new(name + ' Rig', data)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bones = [
        ('Root', (0, 0, 0), (0, 0, .15), None),
        ('Hips', (0, 0, .84), (0, 0, .99), 'Root'),
        ('Spine', (0, 0, .99), (0, 0, 1.32), 'Hips'),
        ('Neck', (0, 0, 1.32), (0, 0, 1.45), 'Spine'),
        ('Head', (0, 0, 1.45), (0, 0, 1.72), 'Neck'),
        ('UpperArm.L', (-.21, 0, 1.30), (-.34, 0, 1.07), 'Spine'),
        ('Forearm.L', (-.34, 0, 1.07), (-.39, -.025, .84), 'UpperArm.L'),
        ('Hand.L', (-.39, -.025, .84), (-.39, -.06, .75), 'Forearm.L'),
        ('UpperArm.R', (.21, 0, 1.30), (.34, 0, 1.07), 'Spine'),
        ('Forearm.R', (.34, 0, 1.07), (.39, -.025, .84), 'UpperArm.R'),
        ('Hand.R', (.39, -.025, .84), (.39, -.06, .75), 'Forearm.R'),
        ('Thigh.L', (-.115, 0, .84), (-.125, 0, .49), 'Hips'),
        ('Shin.L', (-.125, 0, .49), (-.125, 0, .14), 'Thigh.L'),
        ('Foot.L', (-.125, 0, .14), (-.125, -.19, .085), 'Shin.L'),
        ('Thigh.R', (.115, 0, .84), (.125, 0, .49), 'Hips'),
        ('Shin.R', (.125, 0, .49), (.125, 0, .14), 'Thigh.R'),
        ('Foot.R', (.125, 0, .14), (.125, -.19, .085), 'Shin.R'),
    ]
    for bone_name, start, end, parent_name in bones:
        bone = data.edit_bones.new(bone_name)
        bone.head, bone.tail = start, end
        if parent_name:
            bone.parent = data.edit_bones[parent_name]
    bpy.ops.object.mode_set(mode='OBJECT')
    rig.select_set(False)
    return rig


def skin(mesh, rig, bone, material):
    mesh.name = f'{rig.name} {mesh.name}'
    mesh.data.materials.append(material)
    group = mesh.vertex_groups.new(name=bone)
    group.add(list(range(len(mesh.data.vertices))), 1.0, 'REPLACE')
    mesh.parent = rig
    modifier = mesh.modifiers.new('Skin', 'ARMATURE')
    modifier.object = rig
    for poly in mesh.data.polygons:
        poly.use_smooth = True
    return mesh


def sphere(name, loc, scale, rig, bone, material, segments=16, rings=10):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return skin(obj, rig, bone, material)


def cyl(name, loc, radius, depth, rig, bone, material, radius_top=None, vertices=16):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius,
                                    radius2=radius if radius_top is None else radius_top,
                                    depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    return skin(obj, rig, bone, material)


def block(name, loc, scale, rig, bone, material, bevel=.012):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new('Rounded handcrafted edge', 'BEVEL')
        mod.width, mod.segments = bevel, 2
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return skin(obj, rig, bone, material)


def tube(name, points, thickness, rig, bone, material, sides=7):
    # Genuine silhouette accents: seam, embroidery, eyebrow, smiling mouth.
    curve = bpy.data.curves.new(name, type='CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = thickness
    curve.bevel_resolution = 2
    spline = curve.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for p, v in zip(spline.points, points):
        p.co = (*v, 1)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    return skin(bpy.context.object, rig, bone, material)


def build_actor(name, palette):
    clear_scene()
    p = palette
    materials = {key: mat(f'{name} {key}', color) for key, color in p.items()}
    eye = mat(f'{name} brown iris', (.12, .065, .037), .25)
    eye_white = mat(f'{name} warm sclera', (.92, .86, .76), .26)
    seam = mat(f'{name} dark seams', (.11, .115, .12))
    blush = mat(f'{name} lip pigment', (.42, .19, .16))
    rig = create_armature(name)
    skin_color = materials['skin_light']
    # Proportions deliberately adult and person-shaped; all original sculpted forms.
    sphere('shouldered torso', (0, 0, 1.17), (.235, .16, .275), rig, 'Spine', materials['cloth'], 24, 16)
    sphere('waist', (0, .01, .94), (.18, .145, .16), rig, 'Hips', materials['cloth'], 20, 12)
    sphere('neck skin', (0, 0, 1.43), (.073, .071, .115), rig, 'Neck', skin_color, 14, 10)
    sphere('sculpted head', (0, -.005, 1.61), (.133, .115, .178), rig, 'Head', skin_color, 24, 18)
    sphere('nose', (0, -.126, 1.59), (.027, .052, .046), rig, 'Head', skin_color, 14, 10)
    sphere('chin', (0, -.078, 1.48), (.085, .048, .037), rig, 'Head', skin_color)
    for sign, side in ((-1, 'L'), (1, 'R')):
        sphere(f'{side} ear', (sign*.128, 0, 1.60), (.031, .028, .066), rig, 'Head', skin_color)
        sphere(f'{side} eye white', (sign*.052, -.111, 1.636), (.034, .018, .025), rig, 'Head', eye_white, 16, 10)
        sphere(f'{side} dark pupil', (sign*.052, -.127, 1.635), (.016, .009, .018), rig, 'Head', eye, 14, 10)
        tube(f'{side} eyebrow', [(sign*.027, -.122, 1.677),
             (sign*.052, -.121, 1.683), (sign*.084, -.102, 1.674)], .006,
             rig, 'Head', materials['hair'])
        sphere(f'{side} upper arm', (sign*.275, -.005, 1.17), (.086, .086, .155),
               rig, f'UpperArm.{side}', materials['cloth'], 18, 12)
        sphere(f'{side} forearm', (sign*.37, -.025, .95), (.068, .067, .138),
               rig, f'Forearm.{side}', materials['cloth_dark'], 16, 10)
        sphere(f'{side} hand', (sign*.39, -.06, .79), (.047, .038, .075),
               rig, f'Hand.{side}', skin_color)
        sphere(f'{side} thigh', (sign*.125, .005, .67), (.108, .116, .225),
               rig, f'Thigh.{side}', materials['pants'], 20, 12)
        sphere(f'{side} shin', (sign*.125, .008, .325), (.089, .095, .20),
               rig, f'Shin.{side}', materials['pants'], 18, 10)
        sphere(f'{side} shoe', (sign*.125, -.09, .09), (.103, .19, .09),
               rig, f'Foot.{side}', materials['cloth_dark'], 18, 10)
    tube('natural smile', [(-.045, -.124, 1.526), (0, -.135, 1.515),
         (.046, -.124, 1.526)], .005, rig, 'Head', blush)

    if name == 'nada':
        # Field researcher: tailored indigo trousers, olive vest, pockets, orange scarf.
        sphere('dark hair crown', (0, .023, 1.746), (.133, .123, .091),
               rig, 'Head', materials['hair'], 20, 12)
        sphere('pony tail', (0, .126, 1.61), (.065, .068, .205),
               rig, 'Head', materials['hair'])
        cyl('field vest hem', (0, 0, .998), .19, .23, rig, 'Hips', materials['cloth_dark'], radius_top=.208)
        for sign in (-1, 1):
            block('work vest pocket', (sign*.13, -.147, 1.115), (.095, .016, .125),
                  rig, 'Spine', materials['cloth_dark'])
            tube('copper vest piping', [(sign*.19, -.108, 1.34),
                 (sign*.12, -.152, 1.19), (sign*.13, -.15, 1.04)], .007,
                 rig, 'Spine', materials['accent'])
        tube('field scarf drape', [(-.06, -.115, 1.417), (0, -.10, 1.39),
             (.11, -.03, 1.415)], .027, rig, 'Neck', materials['scarf'])
        block('water data tablet', (.39, -.124, .78), (.16, .034, .22),
              rig, 'Hand.R', seam)
        block('tablet blue glass', (.39, -.145, .78), (.135, .005, .175),
              rig, 'Hand.R', materials['cloth'])
    elif name == 'hassan':
        # Traditional working galabeya, old farmer's cap and beard. No film likeness.
        cyl('long linen galabeya', (0, 0, .79), .27, 1.04, rig, 'Hips',
            materials['cloth'], radius_top=.205, vertices=28)
        for sign in (-1, 0, 1):
            tube('fine robe stripe', [(sign*.10, -.206, 1.25),
                 (sign*.13, -.25, .8), (sign*.16, -.27, .38)], .0045,
                 rig, 'Hips', materials['cloth_dark'])
        cyl('white cotton prayer cap', (0, 0, 1.78), .13, .105,
            rig, 'Head', materials['scarf'], radius_top=.115, vertices=28)
        sphere('silver beard', (0, -.079, 1.493), (.099, .085, .102),
               rig, 'Head', materials['hair'], 20, 14)
        for sign in (-1, 1):
            sphere('beard cheek', (sign*.087, -.065, 1.51), (.04, .06, .066),
                   rig, 'Head', materials['hair'])
        # Cane follows the left hand, is floor-reaching and remains a prop.
        cyl('lightweight wooden staff', (-.405, -.08, .43), .019, .85,
            rig, 'Hand.L', materials['accent'], vertices=10)
    else:
        # Maryam: indigo layered rural tunic, rose tarha with fabric tail, ledger.
        cyl('indigo working dress', (0, 0, .81), .30, 1.0, rig, 'Hips',
            materials['cloth'], radius_top=.17, vertices=28)
        tube('embroidered dress neckline', [(-.10, -.13, 1.36), (0, -.165, 1.315),
             (.10, -.13, 1.36)], .012, rig, 'Spine', materials['accent'])
        sphere('headscarf crown', (0, .025, 1.76), (.147, .135, .092),
               rig, 'Head', materials['scarf'], 24, 12)
        tube('headscarf frame', [(-.125, -.047, 1.695), (-.125, -.10, 1.605),
             (-.087, -.10, 1.50), (.087, -.10, 1.50),
             (.125, -.10, 1.605), (.125, -.047, 1.695)], .018,
             rig, 'Head', materials['scarf'])
        sphere('folded scarf tail', (.16, .14, 1.52), (.075, .062, .215),
               rig, 'Head', materials['scarf'])
        tube('tarha copper embroidery', [(-.12, .01, 1.764),
             (0, -.084, 1.794), (.12, .01, 1.764)], .008, rig, 'Head', materials['accent'])
        block('paper irrigation notebook', (.40, -.125, .78), (.22, .027, .28),
              rig, 'Hand.R', materials['accent'])
        block('notebook cover', (.40, -.15, .785), (.205, .009, .265),
              rig, 'Hand.R', materials['cloth_dark'])

    animate(rig, name)
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    for child in rig.children:
        child.select_set(True)
    bpy.context.view_layer.objects.active = rig
    path = DEST / f'{name}.glb'
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB',
                              use_selection=True, export_animations=True,
                              export_animation_mode='NLA_TRACKS',
                              export_nla_strips=True, export_yup=True,
                              export_materials='EXPORT')
    print('SOIL_IQ_CHARACTER', name, path, path.stat().st_size)


def animate(rig, name):
    rig.animation_data_create()
    amplitudes = {
        'Idle': dict(sway=.014, limbs=.03),
        'Walk': dict(sway=.035, limbs=.42),
        'Run': dict(sway=.09, limbs=.68),
        'Talk': dict(sway=.045, limbs=.25),
        'Interact': dict(sway=.025, limbs=.40),
    }
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    for clip, config in amplitudes.items():
        action = bpy.data.actions.new(f'{name}_{clip}')
        rig.animation_data.action = action
        for frame, phase in [(1, 0), (11, .5), (21, 1), (31, 1.5), (41, 2)]:
            for pose_bone in rig.pose.bones:
                pose_bone.rotation_mode = 'XYZ'
                pose_bone.rotation_euler = (0, 0, 0)
            gait = math.sin(phase * math.pi)
            sway = math.sin(phase * math.pi) * config['sway']
            rig.pose.bones['Spine'].rotation_euler[1] = sway
            rig.pose.bones['Head'].rotation_euler[0] = .04 * math.sin(phase * math.pi)
            if clip in ('Walk', 'Run'):
                for side, sign in [('L', 1), ('R', -1)]:
                    rig.pose.bones[f'Thigh.{side}'].rotation_euler[0] = sign * gait * config['limbs']
                    rig.pose.bones[f'Shin.{side}'].rotation_euler[0] = abs(sign * gait) * config['limbs'] * .45
                    rig.pose.bones[f'UpperArm.{side}'].rotation_euler[0] = -sign * gait * config['limbs'] * .55
            elif clip == 'Talk':
                rig.pose.bones['UpperArm.R'].rotation_euler[0] = -.35 - abs(gait) * .27
                rig.pose.bones['Forearm.R'].rotation_euler[1] = .16 + abs(gait) * .15
                rig.pose.bones['Head'].rotation_euler[2] = math.sin(phase * math.pi) * .08
            elif clip == 'Interact':
                rig.pose.bones['UpperArm.R'].rotation_euler[0] = -.8
                rig.pose.bones['Forearm.R'].rotation_euler[0] = -.34
            elif name == 'hassan':
                rig.pose.bones['UpperArm.L'].rotation_euler[0] = -.17
            for pose_bone in rig.pose.bones:
                pose_bone.keyframe_insert(data_path='rotation_euler', frame=frame, group=pose_bone.name)
        action.frame_start, action.frame_end = 1, 41
        track = rig.animation_data.nla_tracks.new()
        track.name = clip
        strip = track.strips.new(clip, 1, action)
        strip.repeat = 1
        rig.animation_data.action = None
    for bone in rig.pose.bones:
        bone.rotation_euler = (0, 0, 0)


for actor_name, colors in PALETTES.items():
    build_actor(actor_name, colors)
