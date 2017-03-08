var rt_scene = (function () {

  /* ************************* */
  /* ***** VARIABLES      **** */
  /* ************************* */

  var scene,     /* webgl scene         */
    camera,      /* webgl cam           */
    controls,    /* webgl mouse control */
    renderer;    /* webgl renderer      */

  var obj_base,       /* Couch Base: it can rotate around fixed Z axe */
    obj_base_target,  // _target represents target position
    obj_couch,        /* Couch: on top of the obj_base, it can move along X/Y/Z axes */
    obj_couch_target,
    obj_robotic,      /* Couch Robotic: on top of the obj_couch, it can rotate around X and Y axes */
    obj_robotic_target,
    obj_top,          /* Couch Top: on top of the obj_robotic, it is fixed with obj_robotic */
    obj_top_target,
    obj_body,         /* Body: on top of the obj_top, it represent a body */
    obj_body_target,
    obj_helper_plane, /* represent a helper plane e.g. a projection of the body onto XY plane */
    obj_model = new THREE.Object3D(), // 3d body model
    obj_model_target = new THREE.Object3D();

  var fps = 30,           /*animation fps*/
    then = Date.now(),    /*the last time the animation is executed*/
    interval = 1000 / fps;/*time interval between animation (ms)*/

  var config_base_world_transf = {// obj_base in world coordinates (fixed on XY plane and rotatable around fixed axis Z on the origon)
    rotateX: 0.0,
    rotateY: 0.0,
    rotateZ: 0.0,
    translateX: 0.0,
    translateY: -100.0,
    translateZ: -130.0
  };
  var config_robotic_couch_transf = {// obj_robotic relative to obj_couch (default with isocentric ZXY rotation with intrinsic translaton)
    rotateX: 0.0,
    rotateY: 0.0,
    rotateZ: 0.0,
    translateX: 0.0,
    translateY: 0.0,
    translateZ: 30.0
  };
  var config_top_robotic_transf = {// obj_top relative to obj_robotic (default with isocentric ZXY rotation with intrinsic translaton)
    rotateX: 0.0,
    rotateY: 0.0,
    rotateZ: 0.0,
    translateX: 0.0,
    translateY: 50.0,
    translateZ: 15.0
  };

  var enum_transf_mode = {// enum for geometrical transformation
    ISOCENTRIC_ZXY: 0,  // Rotation around fixed Z, rotated global X, and then rotated/pitched global Y on the origin; followed by intrinsic translation
    //INTRINSIC_zxy: 1,   // Rotation around own local z, rotated local x, and then rotated/pitched local y; followed by intrinsic translation
    ISOCENTRIC_zXY: 2,  // Rotation around own local z, rotated global X, and then rotated/pitched global Y on the origin; followed by intrinsic translation
  };

  var enum_couch_transf_mode = {// enum for couch transformation
    ISOCENTRIC_ZXY: enum_transf_mode.ISOCENTRIC_ZXY
  };
  var enum_body_top_transf_mode = {// enum for body transfomation relative to couch top
    ISOCENTRIC_ZXY: enum_transf_mode.ISOCENTRIC_ZXY
  };
  var enum_body_correction_transf_mode = {// enum for body position correction transfomation
    ISOCENTRIC_ZXY: enum_transf_mode.ISOCENTRIC_ZXY,
    ISOCENTRIC_zXY: enum_transf_mode.ISOCENTRIC_zXY
  };

  /********************* user gui controls ************************/

  var ctrl_top_world_transf = {// couch top position
    rotateX: 0.0,
    rotateY: 0.0,
    rotateZ: 0.0,
    translateX: 0.0,
    translateY: -80.0,
    translateZ: -20.0,
    mode: enum_couch_transf_mode.ISOCENTRIC_ZXY
  };
  var ctrl_body_top_transf = {// obj_body relative to obj_top
    rotateX: 0.0,
    rotateY: 0.0,
    rotateZ: 0.0,
    translateX: 0.0,
    translateY: -70.0,
    translateZ: 22.0,
    mode: enum_body_top_transf_mode.ISOCENTRIC_ZXY
  };
  var ctrl_body_correction_transf = {// body correction control
    rotateX: 0.0,
    rotateY: 0.0,
    rotateZ: 0.0,
    translateX: 0.0,
    translateY: 0.0,
    translateZ: 0.0,
    mode: enum_body_correction_transf_mode.ISOCENTRIC_ZXY
  };
  var ctrl_gui = {// gui control
    sourceOpacity: 0.1,
    targetOpacity: 1.0,
    showHelperPlane: false,
    showModel: true
  };

  var ctri_debug = {// debug control or dev purpose
    debug_verify_correction_enable: false,        // to verify couch top transformation according to body position correction
    debug_verify_matrics_equal_tolerance: 0.00001 // tolerance to compare matrix elements
  };

  /* ************************* */
  /* ***** FUNCTIONS      **** */
  /* ************************* */

  var initControls = function () {
    const gui = new dat.GUI();
    gui.width = 350;

    const folderCouchTop = gui.addFolder('Initial Couch Top Position');
    folderCouchTop.add(ctrl_top_world_transf, "rotateX", -10.0, 10.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderCouchTop.add(ctrl_top_world_transf, "rotateY", -10.0, 10.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderCouchTop.add(ctrl_top_world_transf, "rotateZ", -100.0, 100.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderCouchTop.add(ctrl_top_world_transf, "translateX", -50.0, 50.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderCouchTop.add(ctrl_top_world_transf, "translateY", -140.0, -20.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderCouchTop.add(ctrl_top_world_transf, "translateZ", -60.0, 10.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderCouchTop.add(ctrl_top_world_transf, "mode", enum_couch_transf_mode).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderCouchTop.open();

    const folderBodyToCouchTop = gui.addFolder('Initial Body Position [relative to Couch Top]');
    folderBodyToCouchTop.add(ctrl_body_top_transf, "rotateX", -10.0, 10.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderBodyToCouchTop.add(ctrl_body_top_transf, "rotateY", -10.0, 10.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderBodyToCouchTop.add(ctrl_body_top_transf, "rotateZ", -15.0, 15.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderBodyToCouchTop.add(ctrl_body_top_transf, "translateX", -40.0, 40.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderBodyToCouchTop.add(ctrl_body_top_transf, "translateY", -100.0, -50.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderBodyToCouchTop.add(ctrl_body_top_transf, "translateZ", 20.0, 30.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderBodyToCouchTop.add(ctrl_body_top_transf, "mode", enum_body_top_transf_mode).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderBodyToCouchTop.close();

    const folderBodyPosCorrection = gui.addFolder('Body Position Correction');
    folderBodyPosCorrection.add(ctrl_body_correction_transf, "rotateX", -90.0, 90.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderBodyPosCorrection.add(ctrl_body_correction_transf, "rotateY", -90.0, 90.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderBodyPosCorrection.add(ctrl_body_correction_transf, "rotateZ", -90.0, 90.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderBodyPosCorrection.add(ctrl_body_correction_transf, "translateX", -50.0, 50.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderBodyPosCorrection.add(ctrl_body_correction_transf, "translateY", -50.0, 50.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderBodyPosCorrection.add(ctrl_body_correction_transf, "translateZ", -50.0, 50.0).step(0.1).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderBodyPosCorrection.add(ctrl_body_correction_transf, "mode", enum_body_correction_transf_mode).listen().onChange(function () { updateSceneObjectsPosition(); });
    folderBodyPosCorrection.open();

    const folderGui = gui.addFolder('Options');
    folderGui.add(ctrl_gui, "sourceOpacity", 0.0, 1.0).step(0.05).listen().onChange(function () { updateSceneObjectsMaterial(); });
    folderGui.add(ctrl_gui, "targetOpacity", 0.0, 1.0).step(0.05).listen().onChange(function () { updateSceneObjectsMaterial(); });
    folderGui.add(ctrl_gui, "showHelperPlane").listen().onChange(function () { updateSceneObjectsPosition(); });
    folderGui.add(ctrl_gui, "showModel").listen().onChange(function () { updateSceneObjectsPosition(); });
    folderGui.open();

    gui.open();
  };

  // create all axes lines
  var buildAxes = function (length) {

    // create single axis line
    var buildAxis = function (src, dst, colorHex, dashed) {
      var mat;
      if (dashed) {
        mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
      } else {
        mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
      }
      const geom = new THREE.Geometry();
      geom.vertices.push(src.clone());
      geom.vertices.push(dst.clone());
      geom.computeLineDistances();

      return new THREE.LineSegments(geom, mat);
    };
    //

    const axes = new THREE.Object3D();
    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0), 0xFF0000, false)); // +X
    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-length, 0, 0), 0xFF0000, true)); // -X
    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length, 0), 0x228b22, false)); // +Y
    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -length, 0), 0x228b22, true)); // -Y
    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, length), 0x0000FF, false)); // +Z
    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -length), 0x0000FF, true)); // -Z
    return axes;
  }
  // add axes labels to the scene
  var addAxesLabel = function () {

    // create text
    var buildText = function (text, font, color, position) {
      const textGeometry = new THREE.TextGeometry(text, {
        size: 15,
        height: 3,
        font: font
      });
      textGeometry.computeBoundingBox();
      const textMaterial = new THREE.MeshBasicMaterial({ color: color, overdraw: 0.5 });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(position.x, position.y, position.z);
      return textMesh;
    };
    //

    const loader = new THREE.FontLoader();
    loader.load('./three.js/examples/fonts/helvetiker_regular.typeface.json', function (font) {
      scene.add(buildText("X", font, 0xff0000,
        new THREE.Vector3(300, 5, 5)));
      scene.add(buildText("Y", font, 0x2c602c,
        new THREE.Vector3(5, 300, 5)));
      scene.add(buildText("Z", font, 0x0000ff,
        new THREE.Vector3(5, 5, 300)));
    });
  }

  var addSceneObjects = function () {
    {
      const geometry = new THREE.BoxGeometry(85, 110, 120);
      const material = new THREE.MeshLambertMaterial({ color: 0xAA5585, shading: THREE.FlatShading, overdraw: 0.5 });
      obj_base = new THREE.Mesh(geometry, material);
      obj_base_target = new THREE.Mesh(geometry.clone(), material.clone());
      scene.add(obj_base);
      scene.add(obj_base_target);
    }

    {
      const geometry = new THREE.BoxGeometry(90, 120, 70);
      const material = new THREE.MeshLambertMaterial({ color: 0xD46A6A, shading: THREE.FlatShading, overdraw: 0.5 });
      obj_couch = new THREE.Mesh(geometry, material);
      obj_couch_target = new THREE.Mesh(geometry.clone(), material.clone());
      scene.add(obj_couch);
      scene.add(obj_couch_target);
    }

    {
      const geometry = new THREE.BoxGeometry(80, 110, 25);
      const material = new THREE.MeshLambertMaterial({ color: 0xD49A6A, shading: THREE.FlatShading, overdraw: 0.5 });
      obj_robotic = new THREE.Mesh(geometry, material);
      obj_robotic_target = new THREE.Mesh(geometry.clone(), material.clone());
      scene.add(obj_robotic);
      scene.add(obj_robotic_target);
    }

    {
      const geometry = new THREE.BoxGeometry(100, 220, 1);
      const material = new THREE.MeshLambertMaterial({ color: 0xcbcbcb, shading: THREE.FlatShading, overdraw: 0.5 });
      obj_top = new THREE.Mesh(geometry, material);
      obj_top_target = new THREE.Mesh(geometry.clone(), material.clone());
      scene.add(obj_top);
      scene.add(obj_top_target);
    }

    {
      const geometry = new THREE.BoxGeometry(70, 180, 20);
      const material = new THREE.MeshLambertMaterial({ color: 0xFFB218, shading: THREE.FlatShading, overdraw: 0.5 });
      obj_body = new THREE.Mesh(geometry, material);
      obj_body_target = new THREE.Mesh(geometry.clone(), material.clone());
      scene.add(obj_body);
      scene.add(obj_body_target);
    }

    {
      const geometry = new THREE.BoxGeometry(200, 400, 1);
      const material = new THREE.MeshLambertMaterial({ color: 0xF4FC03, shading: THREE.FlatShading, overdraw: 0.5 });
      obj_helper_plane = new THREE.Mesh(geometry, material);
      scene.add(obj_helper_plane);
    }

    // load obj model and add it to geometry objects
    {
      const objLoader = new THREE.OBJLoader();
      objLoader.setPath('obj/legoman/');
      objLoader.load('LEGO_Man.obj', function (object) {
        obj_model = object; // ref
        obj_model.scale.set(30, 30, 30);
        const mat_model = new THREE.MeshLambertMaterial({ color: 0xB35A1E, shading: THREE.FlatShading, overdraw: 0.5 });
        mat_model.transparent = true;
        mat_model.opacity = ctrl_gui.sourceOpacity;
        obj_model.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.material = mat_model;
          }
        });
        obj_body.add(obj_model); // added

        obj_model_target = obj_model.clone(); // clone
        const mat_model_target = new THREE.MeshLambertMaterial({ color: 0xB35A1E, shading: THREE.FlatShading, overdraw: 0.5 });
        mat_model_target.transparent = true;
        mat_model_target.opacity = ctrl_gui.targetOpacity;
        obj_model_target.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.material = mat_model_target;
          }
        });
        obj_body_target.add(obj_model_target); // added
      },
        function (xhr) { },
        function (xhr) { console.error('Cannot loading model'); }
      );
    };
  };

  var updateSceneObjectsMaterial = function () {
    obj_base.material.transparent = true;
    obj_base.material.opacity = ctrl_gui.sourceOpacity;
    obj_base_target.material.transparent = true;
    obj_base_target.material.opacity = ctrl_gui.targetOpacity;

    obj_couch.material.transparent = true;
    obj_couch.material.opacity = ctrl_gui.sourceOpacity;
    obj_couch_target.material.transparent = true;
    obj_couch_target.material.opacity = ctrl_gui.targetOpacity;

    obj_robotic.material.transparent = true;
    obj_robotic.material.opacity = ctrl_gui.sourceOpacity;
    obj_robotic_target.material.transparent = true;
    obj_robotic_target.material.opacity = ctrl_gui.targetOpacity;

    obj_top.material.transparent = true;
    obj_top.material.opacity = ctrl_gui.sourceOpacity;
    obj_top_target.material.transparent = true;
    obj_top_target.material.opacity = ctrl_gui.targetOpacity;

    obj_body.material.transparent = true;
    obj_body.material.opacity = ctrl_gui.sourceOpacity;
    obj_body_target.material.transparent = true;
    obj_body_target.material.opacity = ctrl_gui.targetOpacity;

    obj_helper_plane.material.transparent = true;
    obj_helper_plane.material.opacity = ctrl_gui.sourceOpacity;

    obj_model.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.material.transparent = true;
        child.material.opacity = ctrl_gui.sourceOpacity;
      }
    });

    obj_model_target.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.material.transparent = true;
        child.material.opacity = ctrl_gui.targetOpacity;
      }
    });
  };

  var updateSceneObjectsPosition = function () {

    {// TOP (determin couch top position at first in the world coordinates)
      if (ctrl_top_world_transf.mode == enum_transf_mode.ISOCENTRIC_ZXY) {
        // M_{top-world}
        const m_top_transform = RTGEO.create_isocentric_ZXY_Matrix4(
          RTGEO.degree_to_rad(ctrl_top_world_transf.rotateX),
          RTGEO.degree_to_rad(ctrl_top_world_transf.rotateY),
          RTGEO.degree_to_rad(ctrl_top_world_transf.rotateZ),
          ctrl_top_world_transf.translateX,
          ctrl_top_world_transf.translateY,
          ctrl_top_world_transf.translateZ);
        // assign matrix
        obj_top.matrix = m_top_transform;
        obj_top.matrixAutoUpdate = false;
      }
      else {
        throw "The detected mode is Not implemented yet";
      }
    }

    {// BODY (Body position is initiated relative to known initial couch top position)
      if (ctrl_body_top_transf.mode == enum_transf_mode.ISOCENTRIC_ZXY) {
        // M_{body-top}
        const m_body_top_transform = RTGEO.create_isocentric_ZXY_Matrix4(
          RTGEO.degree_to_rad(ctrl_body_top_transf.rotateX),
          RTGEO.degree_to_rad(ctrl_body_top_transf.rotateY),
          RTGEO.degree_to_rad(ctrl_body_top_transf.rotateZ),
          ctrl_body_top_transf.translateX,
          ctrl_body_top_transf.translateY,
          ctrl_body_top_transf.translateZ);
        // M_{body-world} = M_{top-world} * M_{body-top}
        const m_body_transform = new THREE.Matrix4();
        m_body_transform.multiplyMatrices(obj_top.matrix, m_body_top_transform);
        // assign matrix
        obj_body.matrix = m_body_transform;
        obj_body.matrixAutoUpdate = false;
        obj_body.material.visible = !ctrl_gui.showModel;
      }
      else {
        throw "The detected mode is Not implemented yet";
      }
    }

    {// BODY_TARGET (determine the body target position according to body position correction)
      if (ctrl_body_correction_transf.mode == enum_transf_mode.ISOCENTRIC_ZXY) {
        // M_{bodytarget-body}
        const m_bodytarget_body_transform = RTGEO.create_isocentric_ZXY_Matrix4(
          RTGEO.degree_to_rad(ctrl_body_correction_transf.rotateX),
          RTGEO.degree_to_rad(ctrl_body_correction_transf.rotateY),
          RTGEO.degree_to_rad(ctrl_body_correction_transf.rotateZ),
          ctrl_body_correction_transf.translateX,
          ctrl_body_correction_transf.translateY,
          ctrl_body_correction_transf.translateZ);
        // M_{bodytarget-wolrd} = M_{bodytarget-body} * M_{body-wolrd}
        const m_bodytarget_transform = new THREE.Matrix4();
        m_bodytarget_transform.multiplyMatrices(m_bodytarget_body_transform, obj_body.matrix);
        // assign matrix
        obj_body_target.matrix = m_bodytarget_transform;
        obj_body_target.matrixAutoUpdate = false;
        obj_body_target.material.visible = !ctrl_gui.showModel;
        // visualize helper plane: rotation part of M_{bodytarget-body}_R
        const m_helperplane_transform = new THREE.Matrix4();
        m_helperplane_transform.extractRotation(m_bodytarget_body_transform);
        obj_helper_plane.matrix = m_helperplane_transform;
        obj_helper_plane.matrixAutoUpdate = false;
        obj_helper_plane.visible = ctrl_gui.showHelperPlane;
      }
      else if (ctrl_body_correction_transf.mode == enum_transf_mode.ISOCENTRIC_zXY) {
        // M_{bodytarget-body}
        const m_bodytarget_body_transform = RTGEO.create_isocentric_ZXY_Matrix4(
          RTGEO.degree_to_rad(ctrl_body_correction_transf.rotateX),
          RTGEO.degree_to_rad(ctrl_body_correction_transf.rotateY),
          RTGEO.degree_to_rad(ctrl_body_correction_transf.rotateZ),
          ctrl_body_correction_transf.translateX,
          ctrl_body_correction_transf.translateY,
          ctrl_body_correction_transf.translateZ);
        // M_{body-world}_Rz: transformation matrix of Z rotation of M_{body-world}
        const v_body_rotation_angles/*rad*/ = RTGEO.to_Euler_ZXY_Vector4(obj_body.matrix);
        const m_undo_body_rotation_z = RTGEO.create_Euler_ZXY_Matrix4(0, 0, -v_body_rotation_angles.z);
        const m_redo_body_rotation_z = RTGEO.create_Euler_ZXY_Matrix4(0, 0, v_body_rotation_angles.z);
        // transformation for body target position
        // M_{bodytarget-world} = M_redo_Rz * M_{bodytarget-body} * M_undo_Rz * M_{body-world}
        // where  M_undo_Rz := M_{body-world}_Rz^-1
        //        M_redo_Rz := M_{body-world}_Rz
        const m_bodytarget_transform = new THREE.Matrix4();
        m_bodytarget_transform.multiplyMatrices(m_undo_body_rotation_z, obj_body.matrix);
        m_bodytarget_transform.multiplyMatrices(m_bodytarget_body_transform, m_bodytarget_transform);
        m_bodytarget_transform.multiplyMatrices(m_redo_body_rotation_z, m_bodytarget_transform);
        // assign matrix
        obj_body_target.matrix = m_bodytarget_transform;
        obj_body_target.matrixAutoUpdate = false;
        obj_body_target.material.visible = !ctrl_gui.showModel;
        // visualize helper plane: rotation part of M_{body-world}_Rz * M_{bodytarget-body}
        const m_helperplane_transform = new THREE.Matrix4();
        m_helperplane_transform.multiplyMatrices(m_redo_body_rotation_z, m_bodytarget_body_transform);
        m_helperplane_transform.extractRotation(m_helperplane_transform.clone());
        obj_helper_plane.matrix = m_helperplane_transform;
        obj_helper_plane.matrixAutoUpdate = false;
        obj_helper_plane.visible = ctrl_gui.showHelperPlane;
      }
      else {
        throw "The detected mode is Not implemented yet";
      }
    }

    {// 3D MODEL (visibility of model/model_taget inside body/body_target)
      obj_model.visible = ctrl_gui.showModel;
      obj_model_target.visible = ctrl_gui.showModel;
    }

    {// TOP_TARGET (determine couch top target position relative to known body target position)
      if (ctrl_body_top_transf.mode == enum_transf_mode.ISOCENTRIC_ZXY) {
        // M_{bodytarget-toptarget} =~ M_{body-top}
        const m_bodytarget_toptarget_transform = RTGEO.create_isocentric_ZXY_Matrix4(
          RTGEO.degree_to_rad(ctrl_body_top_transf.rotateX),
          RTGEO.degree_to_rad(ctrl_body_top_transf.rotateY),
          RTGEO.degree_to_rad(ctrl_body_top_transf.rotateZ),
          ctrl_body_top_transf.translateX,
          ctrl_body_top_transf.translateY,
          ctrl_body_top_transf.translateZ);
        // M_{bodytarget-toptarget}^-1
        const m_inverse_bodytarget_toptarget_transform = new THREE.Matrix4();
        m_inverse_bodytarget_toptarget_transform.getInverse(m_bodytarget_toptarget_transform);
        // M_{toptarget-world} = M_{bodytarget-world} * M_{bodytarget-toptarget}^-1
        const m_toptarget_transform = new THREE.Matrix4();
        m_toptarget_transform.multiplyMatrices(obj_body_target.matrix, m_inverse_bodytarget_toptarget_transform);
        // assign matrix
        obj_top_target.matrix = m_toptarget_transform;
        obj_top_target.matrixAutoUpdate = false;
      }
      else {
        throw "The detected mode is Not implemented yet";
      }
    }

    // visualize other objects

    {// ROBOTIC (attached to TOP)
      // M_{top-robotic}
      const m_top_robotic_transform = RTGEO.create_isocentric_ZXY_Matrix4/*default*/(
        RTGEO.degree_to_rad(config_top_robotic_transf.rotateX),
        RTGEO.degree_to_rad(config_top_robotic_transf.rotateY),
        RTGEO.degree_to_rad(config_top_robotic_transf.rotateZ),
        config_top_robotic_transf.translateX,
        config_top_robotic_transf.translateY,
        config_top_robotic_transf.translateZ);
      // M_{top-robotic}^-1
      const m_inverse_top_robotic_transform = new THREE.Matrix4();
      m_inverse_top_robotic_transform.getInverse(m_top_robotic_transform);
      // M_{robotic-world} = M_{top-world} * M_{top-robotic}^-1
      const m_robotic_transform = new THREE.Matrix4();
      m_robotic_transform.multiplyMatrices(obj_top.matrix, m_inverse_top_robotic_transform);
      // assign matrix
      obj_robotic.matrix = m_robotic_transform;
      obj_robotic.matrixAutoUpdate = false;
    }
    {// ROBOTIC_TARGET (attached to TOP_TARGET)
      // M_{toptarget-robotictarget} =~ M_{top-robotic}
      const m_toptarget_robotictarget_transform = RTGEO.create_isocentric_ZXY_Matrix4/*default*/(
        RTGEO.degree_to_rad(config_top_robotic_transf.rotateX),
        RTGEO.degree_to_rad(config_top_robotic_transf.rotateY),
        RTGEO.degree_to_rad(config_top_robotic_transf.rotateZ),
        config_top_robotic_transf.translateX,
        config_top_robotic_transf.translateY,
        config_top_robotic_transf.translateZ);
      // M_{toptarget-robotictarget}^-1
      const m_inverse_toptarget_robotictarget_transform = new THREE.Matrix4();
      m_inverse_toptarget_robotictarget_transform.getInverse(m_toptarget_robotictarget_transform);
      // M_{robotictarget-world} = M_{toptarget-world} * M_{toptarget-robotictarget}^-1
      const m_robotictarget_transform = new THREE.Matrix4();
      m_robotictarget_transform.multiplyMatrices(obj_top_target.matrix, m_inverse_toptarget_robotictarget_transform);
      // assign matrix
      obj_robotic_target.matrix = m_robotictarget_transform;
      obj_robotic_target.matrixAutoUpdate = false;
    }

    {// COUCH
      // [M_{robotic-world}_R, V_{robotic-world}_T]: intrisic rotation and translation from M_{robotic-world} 
      var [m_robotic_transform_R, v_robotic_translate] = RTGEO.extract_intrinsic_R_T(obj_robotic.matrix);
      // M_{robotic-world}_Rz_RzT: keep only rotaion Z effect
      const m_robotic_transform_Rz_RzT = RTGEO.create_isocentric_ZXY_Matrix4/*default*/(
        0, 0, RTGEO.to_Euler_ZXY_Vector4(m_robotic_transform_R).z/*rad*/,
        v_robotic_translate.x, v_robotic_translate.y, v_robotic_translate.z
      );
      // M_{robotic-couch}
      const m_robotic_couch_transform = RTGEO.create_isocentric_ZXY_Matrix4/*default*/(
        RTGEO.degree_to_rad(config_robotic_couch_transf.rotateX),
        RTGEO.degree_to_rad(config_robotic_couch_transf.rotateY),
        RTGEO.degree_to_rad(config_robotic_couch_transf.rotateZ),
        config_robotic_couch_transf.translateX,
        config_robotic_couch_transf.translateY,
        config_robotic_couch_transf.translateZ);
      // M_{robotic-couch}^-1
      const m_inverse_robotic_couch_transform = new THREE.Matrix4();
      m_inverse_robotic_couch_transform.getInverse(m_robotic_couch_transform);
      // M_{couch-world} = M_{robotic-world}_Rz_RzT * M_{robotic-couch}^-1
      const m_couch_transform = new THREE.Matrix4();
      m_couch_transform.multiplyMatrices(m_robotic_transform_Rz_RzT, m_inverse_robotic_couch_transform);
      obj_couch.matrix = m_couch_transform;
      obj_couch.matrixAutoUpdate = false;
    }
    {// COUCH_TARGET
      // [M_{robotictarget-world}_R, V_{robotictarget-world}_T]: intrisic rotation and translation from M_{robotictarget-world} 
      var [m_robotictarget_transform_R, v_robotictarget_translate] = RTGEO.extract_intrinsic_R_T(obj_robotic_target.matrix);
      // M_{robotictarget-world}_Rz_RzT: keep only rotaion Z effect
      const m_robotictarget_transform_Rz_RzT = RTGEO.create_isocentric_ZXY_Matrix4/*default*/(
        0, 0, RTGEO.to_Euler_ZXY_Vector4(m_robotictarget_transform_R).z/*rad*/,
        v_robotictarget_translate.x, v_robotictarget_translate.y, v_robotictarget_translate.z
      );
      // M_{robotictarget-couchtarget} =  M_{robotic-couch}
      const m_robotictarget_couchtarget_transform = RTGEO.create_isocentric_ZXY_Matrix4/*default*/(
        RTGEO.degree_to_rad(config_robotic_couch_transf.rotateX),
        RTGEO.degree_to_rad(config_robotic_couch_transf.rotateY),
        RTGEO.degree_to_rad(config_robotic_couch_transf.rotateZ),
        config_robotic_couch_transf.translateX,
        config_robotic_couch_transf.translateY,
        config_robotic_couch_transf.translateZ);
      // M_{robotictarget-couchtarget}^-1
      const m_inverse_robotictarget_couchtarget_transform = new THREE.Matrix4();
      m_inverse_robotictarget_couchtarget_transform.getInverse(m_robotictarget_couchtarget_transform);
      // M_{couchtarget-world} = M_{robotictarget-world} * M_{robotictarget-couchtarget}^-1
      const m_couchtarget_transform = new THREE.Matrix4();
      m_couchtarget_transform.multiplyMatrices(m_robotictarget_transform_Rz_RzT, m_inverse_robotictarget_couchtarget_transform);
      obj_couch_target.matrix = m_couchtarget_transform;
      obj_couch_target.matrixAutoUpdate = false;
    }

    {// BASE
      // M_{base-world}
      const m_base_transform = RTGEO.create_isocentric_ZXY_Matrix4/*default*/(
        RTGEO.degree_to_rad(config_base_world_transf.rotateX),
        RTGEO.degree_to_rad(config_base_world_transf.rotateY),
        RTGEO.degree_to_rad(config_base_world_transf.rotateZ),
        config_base_world_transf.translateX,
        config_base_world_transf.translateY,
        config_base_world_transf.translateZ);
      // M_{baset-world} = M_{couch-world}_Rz * M_{base-world}
      const v_couch_rotation_angles/*rad*/ = RTGEO.to_Euler_ZXY_Vector4(obj_couch.matrix);
      const m_couch_rot_z = RTGEO.create_Euler_ZXY_Matrix4(0, 0, v_couch_rotation_angles.z);
      m_base_transform.multiplyMatrices(m_couch_rot_z, m_base_transform);
      // assign matrix
      obj_base.matrix = m_base_transform;
      obj_base.matrixAutoUpdate = false;
    }
    {// BASE_TARGET
      // M_{basetarget-world}
      const m_basetarget_transform = RTGEO.create_isocentric_ZXY_Matrix4/*default*/(
        RTGEO.degree_to_rad(config_base_world_transf.rotateX),
        RTGEO.degree_to_rad(config_base_world_transf.rotateY),
        RTGEO.degree_to_rad(config_base_world_transf.rotateZ),
        config_base_world_transf.translateX,
        config_base_world_transf.translateY,
        config_base_world_transf.translateZ);
      // M_{basetarget-world} = M_{couchtarget-world}_Rz * M_{basetarget-world}
      const v_couchtarget_rotation_angles/*rad*/ = RTGEO.to_Euler_ZXY_Vector4(obj_couch_target.matrix);
      const m_couchtarget_rot_z = RTGEO.create_Euler_ZXY_Matrix4(0, 0, v_couchtarget_rotation_angles.z);
      m_basetarget_transform.multiplyMatrices(m_couchtarget_rot_z, m_basetarget_transform);
      // assin matrix
      obj_base_target.matrix = m_basetarget_transform;
      obj_base_target.matrixAutoUpdate = false;
    }

    debug_verify();

  };

  var debug_verify = function () {
    
    if (ctri_debug.debug_verify_correction_enable) {

      // M_{top-world}: couch top initial position
      const m_top_transform = obj_top.matrix;
      // M_{toptarget-world}: couch top target position
      const m_toptarget_transform = obj_top_target.matrix;
      // M_{bodytarget-wolrd} = M_{correction} * M_{body-wolrd}
      const m_bodytarget_transform = obj_body_target.matrix;
      const m_body_transform = obj_body.matrix;
      const m_inverse_body_transform = new THREE.Matrix4();
      m_inverse_body_transform.getInverse(m_body_transform);
      // M_{correction}
      const m_correction_transform = new THREE.Matrix4();
      m_correction_transform.multiplyMatrices(m_bodytarget_transform, m_inverse_body_transform);
      // to verify if
      // M_{toptarget-world} = M_{correction} * M_{top-world}
      const m_toptarget_transform_verify = new THREE.Matrix4();
      m_toptarget_transform_verify.multiplyMatrices(m_correction_transform, m_top_transform);
      const tolerance = ctri_debug.debug_verify_matrics_equal_tolerance;
      for (var i = 0; i < 16; i++) {
        const deviation = m_toptarget_transform_verify.elements[i] - m_toptarget_transform.elements[i];
        console.assert(Math.abs(deviation) < tolerance, m_toptarget_transform_verify.elements, m_toptarget_transform.elements);
      }

    }

  };

  var init = function (canvas/*dom element ID*/) {

    // init gui controls
    initControls();

    // init scene
    scene = new THREE.Scene();

    // init camera
    {
      camera = new THREE.OrthographicCamera(
        window.innerWidth / -2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        window.innerHeight / -2,
        1, 10000);
      camera.position.set(150, -200, 200);
      camera.up.set(0, 0, 1);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

    // init lights
    {
      const ambLight = new THREE.AmbientLight(0x303030);
      scene.add(ambLight);
      const light1 = new THREE.DirectionalLight(0xffffff, .6);
      light1.position.set(800, 400, 800);
      scene.add(light1);
      const light2 = new THREE.DirectionalLight(0xffffff, .3);
      light2.position.set(-400, -400, 800);
      scene.add(light2);
      const light3 = new THREE.DirectionalLight(0xffffff, .1);
      light3.position.set(0, 0, -400);
      scene.add(light3);
    }

    // init coordinate axes
    {
      scene.add(buildAxes(1000));
      addAxesLabel();
    }

    // init objects
    addSceneObjects();
    updateSceneObjectsMaterial();

    // init renderer
    {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setClearColor(0xf0f0f0);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      const container = document.getElementById(canvas);
      container.appendChild(renderer.domElement);
    }

    // init control
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    // update objects
    updateSceneObjectsPosition();
  };

  var onWindowResize = function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  var show = function () {
    requestAnimationFrame(show);

    // do animation under a specific max fps
    const now = Date.now();
    const delta = now - then;
    if (delta > interval) {
      then = now - (delta % interval);
    }
    else {
      return;
    }

    renderer.render(scene, camera);
    controls.update();
  };

  /* ****************************** */
  /* ***** PUBLIC METHODS      **** */
  /* ****************************** */

  return {
    init: init,
    show: show
  };

})();