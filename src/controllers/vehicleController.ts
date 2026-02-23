import { Request, Response } from 'express';
import { pool } from '../config/db';

/**
 * Met à jour le type de véhicule pour un véhicule spécifique
 * Body: { id, immatriculation, oldType, newType }
 */
export const updateVehicleType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, immatriculation, oldType, newType } = req.body;

    // Validation des champs requis
    if (!id || !immatriculation || !oldType || !newType) {
      res.status(400).json({
        message: 'Champs manquants',
        required: ['id', 'immatriculation', 'oldType', 'newType'],
      });
      return;
    }

    // Validation que les types sont des strings non vides
    if (typeof oldType !== 'string' || typeof newType !== 'string' || 
        oldType.trim() === '' || newType.trim() === '') {
      res.status(400).json({
        message: 'oldType et newType doivent être des chaînes non vides',
      });
      return;
    }

    // Validation que id est un nombre valide
    const vehicleId = parseInt(id, 10);
    if (isNaN(vehicleId)) {
      res.status(400).json({
        message: 'id doit être un nombre valide',
      });
      return;
    }

    // Vérifier d'abord que le véhicule existe avec les critères donnés
    const [checkRows]: any = await pool.query(
      `SELECT id, immatriculation, typevehicule 
       FROM vehicules 
       WHERE id = ? AND immatriculation = ? AND typevehicule = ? 
       LIMIT 1`,
      [vehicleId, immatriculation, oldType]
    );

    if (checkRows.length === 0) {
      res.status(404).json({
        message: 'Véhicule non trouvé avec les critères spécifiés',
        criteria: { id: vehicleId, immatriculation, typevehicule: oldType },
      });
      return;
    }

    // Mettre à jour le type de véhicule
    const [updateResult]: any = await pool.query(
      `UPDATE vehicules 
       SET typevehicule = ? 
       WHERE id = ? AND immatriculation = ? AND typevehicule = ?`,
      [newType, vehicleId, immatriculation, oldType]
    );

    // Vérifier si la mise à jour a affecté des lignes
    if (updateResult.affectedRows === 0) {
      res.status(500).json({
        message: 'Aucune ligne mise à jour. Vérifiez les critères.',
      });
      return;
    }

    // Récupérer le véhicule mis à jour pour confirmation
    const [updatedRows]: any = await pool.query(
      `SELECT id, immatriculation, typevehicule, datevisite, datevalidite, agences 
       FROM vehicules 
       WHERE id = ? AND immatriculation = ? 
       LIMIT 1`,
      [vehicleId, immatriculation]
    );

    res.json({
      message: 'Type de véhicule mis à jour avec succès',
      updated: {
        id: vehicleId,
        immatriculation,
        oldType,
        newType,
      },
      vehicle: updatedRows[0],
    });
  } catch (error) {
    console.error('Erreur updateVehicleType:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du type de véhicule',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    });
  }
};

/**
 * Met à jour le type de véhicule pour plusieurs véhicules (batch)
 * Body: { updates: [{ id, immatriculation, oldType, newType }, ...] }
 */
export const batchUpdateVehicleTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { updates } = req.body;

    // Validation
    if (!Array.isArray(updates) || updates.length === 0) {
      res.status(400).json({
        message: 'updates doit être un tableau non vide',
      });
      return;
    }

    // Limiter le nombre de mises à jour par requête pour éviter les surcharges
    if (updates.length > 100) {
      res.status(400).json({
        message: 'Maximum 100 mises à jour par requête',
      });
      return;
    }

    const results = [];
    const errors = [];

    // Utiliser une transaction pour garantir la cohérence
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const update of updates) {
        const { id, immatriculation, oldType, newType } = update;

        // Validation de chaque mise à jour
        if (!id || !immatriculation || !oldType || !newType) {
          errors.push({
            update,
            error: 'Champs manquants',
          });
          continue;
        }

        const vehicleId = parseInt(id, 10);
        if (isNaN(vehicleId)) {
          errors.push({
            update,
            error: 'id doit être un nombre valide',
          });
          continue;
        }

        try {
          // Vérifier que le véhicule existe
          const [checkRows]: any = await connection.query(
            `SELECT id, immatriculation, typevehicule 
             FROM vehicules 
             WHERE id = ? AND immatriculation = ? AND typevehicule = ? 
             LIMIT 1`,
            [vehicleId, immatriculation, oldType]
          );

          if (checkRows.length === 0) {
            errors.push({
              update,
              error: 'Véhicule non trouvé avec les critères spécifiés',
            });
            continue;
          }

          // Mettre à jour
          const [updateResult]: any = await connection.query(
            `UPDATE vehicules 
             SET typevehicule = ? 
             WHERE id = ? AND immatriculation = ? AND typevehicule = ?`,
            [newType, vehicleId, immatriculation, oldType]
          );

          if (updateResult.affectedRows > 0) {
            results.push({
              id: vehicleId,
              immatriculation,
              oldType,
              newType,
              success: true,
            });
          } else {
            errors.push({
              update,
              error: 'Aucune ligne mise à jour',
            });
          }
        } catch (err) {
          errors.push({
            update,
            error: err instanceof Error ? err.message : 'Erreur inconnue',
          });
        }
      }

      // Si toutes les mises à jour ont échoué, annuler la transaction
      if (results.length === 0 && errors.length > 0) {
        await connection.rollback();
        res.status(400).json({
          message: 'Toutes les mises à jour ont échoué',
          errors,
        });
        return;
      }

      // Commit la transaction si au moins une mise à jour a réussi
      await connection.commit();

      res.json({
        message: `${results.length} mise(s) à jour réussie(s), ${errors.length} erreur(s)`,
        results,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erreur batchUpdateVehicleTypes:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour en lot',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    });
  }
};









